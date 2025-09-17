import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { 
  replicate, 
  MODELS, 
  DEFAULT_PARAMS,
  selectGenerationModel,
  waitForPrediction 
} from "./lib/replicateClient";
import { uploadImageFromUrl, uploadImageFromBase64, generateImageKey } from "./lib/r2";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";

/**
 * Enhance a prompt using OpenRouter AI
 */
export const enhancePrompt = action({
  args: {
    imageUrls: v.array(v.string()),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { imageUrls, userPrompt } = args;
    
    try {
      // Build the message with image URLs
      let message = "You are an expert at creating detailed prompts for AI image generation. ";
      message += "Analyze these images and create an enhanced, detailed prompt that will blend them naturally. ";
      message += "Consider composition, lighting, style, and how to naturally combine the subjects.\n\n";
      
      if (userPrompt) {
        message += `User's request: "${userPrompt}"\n\n`;
      }
      
      message += "Images to blend:\n";
      imageUrls.forEach((url, index) => {
        message += `${index + 1}) ${url}\n`;
      });
      
      message += "\nProvide an enhanced prompt that will create a cohesive, high-quality blended image.";
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "You are an expert prompt engineer for AI image generation. Transform simple user requests into detailed, rich prompts. ALWAYS enhance the prompt significantly by adding: specific lighting (golden hour, studio, dramatic), composition details (rule of thirds, centered, dynamic angle), style (photorealistic, cinematic, artistic), atmosphere (mood, ambiance), quality markers (8K, professional photography, high detail), and environmental context. Make the prompt 50-100 words. Be creative and descriptive."
            },
            {
              role: "user",
              content: message + "\n\nIMPORTANT: Create a detailed, enhanced prompt that is MUCH more descriptive than the user's simple request. Add specific details about lighting, composition, style, mood, and quality."
            }
          ],
          temperature: 0.8,
          max_tokens: 250,
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error("OpenRouter error:", error);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      
      const result = await response.json();
      const enhancedPrompt = result.choices[0]?.message?.content || userPrompt || "Blend these images naturally";
      
      console.log("Enhanced prompt:", enhancedPrompt);
      
      return { 
        success: true, 
        enhancedPrompt,
        originalPrompt: userPrompt 
      };
    } catch (error) {
      console.error("Prompt enhancement failed:", error);
      // Fallback to original prompt if enhancement fails
      return { 
        success: false, 
        enhancedPrompt: userPrompt || "Blend these images creatively",
        originalPrompt: userPrompt,
        error: error instanceof Error ? error.message : "Enhancement failed"
      };
    }
  },
});

/**
 * Upload a local image to R2 storage
 */
export const uploadImage = action({
  args: {
    userId: v.id("users"),
    base64Data: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, base64Data, contentType = "image/jpeg" } = args;
    
    try {
      // Generate unique key for the image
      const extension = contentType.split("/")[1] || "jpg";
      const imageKey = generateImageKey(userId, "upload", extension);
      
      // Upload to R2
      const imageUrl = await uploadImageFromBase64(base64Data, imageKey, contentType);
      
      console.log("Image uploaded to R2:", imageUrl);
      
      return { success: true, imageUrl };
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error(error instanceof Error ? error.message : "Upload failed");
    }
  },
});

/**
 * Generate an image using AI
 */
export const generateImage = action({
  args: {
    userId: v.id("users"),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    quality: v.optional(v.union(v.literal("fast"), v.literal("balanced"), v.literal("high"))),
    seed: v.optional(v.number()),
    aspectRatio: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, prompt, negativePrompt, quality = "balanced", seed, aspectRatio } = args;
    
    // Create image record in database with pending status
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt,
      negativePrompt,
      type: "generated",
      model: quality === "high" ? "sdxl" : quality === "fast" ? "sdxl-lightning" : "playground",
    });
    
    try {
      // Simple direct API call to Replicate
      const response = await fetch(
        "https://api.replicate.com/v1/models/google/nano-banana/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "wait"
          },
          body: JSON.stringify({
            input: {
              prompt: prompt,
              image_input: [],
              output_format: "jpg"
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log("Replicate response:", result);
      
      // Get the output URL
      const outputUrl = result.output;
      
      if (!outputUrl || !outputUrl.startsWith('http')) {
        throw new Error("Invalid output URL from model");
      }
      
      console.log("Final image URL:", outputUrl);
      
      // Upload to R2
      const imageKey = generateImageKey(userId, "generated");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);
      
      // Update image record with success
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          seed: seed,
          width: 1024,
          height: 1024,
        },
      });
      
      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Generation failed:", error);
      
      // Update image record with failure
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Generation failed",
      });
      
      throw error;
    }
  },
});

/**
 * Mix multiple images with AI (using nano-banana)
 */
export const mixImages = action({
  args: {
    userId: v.id("users"),
    imageUrls: v.array(v.string()),
    prompt: v.optional(v.string()),
    negativePrompt: v.optional(v.string()),
    seed: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, imageUrls, prompt = "Blend these images naturally", negativePrompt, seed } = args;
    
    // Create image record
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt,
      negativePrompt,
      type: "edited",
      model: "nano-banana-mix",
    });
    
    try {
      // Validate and format image URLs
      console.log("Input image URLs:", imageUrls);
      
      // Ensure URLs are proper HTTP/HTTPS URLs
      const validatedUrls = imageUrls.map(url => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error(`Invalid image URL: ${url}. URLs must start with http:// or https://`);
        }
        return url;
      });
      
      // Call nano-banana with multiple images - image_input expects array of strings
      const requestBody = {
        input: {
          prompt: prompt || "Blend these images creatively",
          image_input: validatedUrls, // Direct array of strings, not objects
          output_format: "jpg"
        }
      };
      
      console.log("Calling nano-banana with body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(
        "https://api.replicate.com/v1/models/google/nano-banana/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "wait"
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Replicate API error response:`, errorText);
        throw new Error(`Replicate API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Mix images response:", result);
      
      const outputUrl = result.output;
      
      if (!outputUrl || !outputUrl.startsWith('http')) {
        throw new Error("Invalid output URL from model");
      }
      
      // Upload to R2
      const imageKey = generateImageKey(userId, "edited");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);
      
      // Update image record - use first image as originalImageUrl
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrls[0], // Use first image for compatibility with schema
          seed: seed,
        },
      });
      
      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Image mixing failed:", error);
      
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Image mixing failed",
      });
      
      throw error;
    }
  },
});

/**
 * Remove background from an image (using Bria)
 */
export const removeBackground = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
    preservePartialAlpha: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, imageUrl, preservePartialAlpha = true } = args;
    
    // Create image record
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt: "Background removed",
      type: "bg-removed",
      model: "bria-remove-background",
      originalImageUrl: imageUrl,
    });
    
    try {
      // Call Bria remove-background API
      const response = await fetch(
        "https://api.replicate.com/v1/models/bria/remove-background/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "wait"
          },
          body: JSON.stringify({
            input: {
              image: imageUrl,
              content_moderation: false,
              preserve_partial_alpha: preservePartialAlpha
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Remove background response:", result);
      
      const outputUrl = result.output;
      
      if (!outputUrl || !outputUrl.startsWith('http')) {
        throw new Error("Invalid output URL from model");
      }
      
      // Upload to R2
      const imageKey = generateImageKey(userId, "bg-removed", "png");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);
      
      // Update image record
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrl,
        },
      });
      
      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Background removal failed:", error);
      
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Background removal failed",
      });
      
      throw error;
    }
  },
});

/**
 * Edit an image with a prompt
 */
export const editImage = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
    prompt: v.string(),
    guidanceScale: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, imageUrl, prompt, guidanceScale = 7.5 } = args;
    
    // Create image record
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt,
      type: "edited",
      model: "instruct-pix2pix",
      originalImageUrl: imageUrl,
    });
    
    try {
      const input = {
        image: imageUrl,
        prompt,
        ...DEFAULT_PARAMS.instructPix2Pix,
        guidance_scale: guidanceScale, // Override default value
      };
      
      console.log("Editing image with InstructPix2Pix");
      
      // Run the model
      const output = await replicate.run(MODELS.edit.instructPix2Pix as any, { input });
      
      const outputUrl = Array.isArray(output) ? output[0] : output;
      
      if (!outputUrl) {
        throw new Error("No output from model");
      }
      
      // Upload to R2
      const imageKey = generateImageKey(userId, "edited");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);
      
      // Update image record
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrl,
        },
      });
      
      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Edit failed:", error);
      
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Edit failed",
      });

      throw error;
    }
  },
});

/**
 * Restore an image (fix blur, scratches, colors, etc.)
 */
export const restoreImage = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
    safetyTolerance: v.optional(v.union(v.literal(0), v.literal(1), v.literal(2))),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
    imageUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, imageUrl, safetyTolerance = 2 } = args;

    // Create image record
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt: "Image restored",
      type: "restored",
      model: "restore-image",
      originalImageUrl: imageUrl,
    });

    try {
      // Call Replicate restore-image API
      const response = await fetch(
        "https://api.replicate.com/v1/models/flux-kontext-apps/restore-image/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "wait"
          },
          body: JSON.stringify({
            input: {
              input_image: imageUrl,
              output_format: "png",
              safety_tolerance: safetyTolerance
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Replicate API error response:`, errorText);
        throw new Error(`Replicate API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Restore image response:", result);

      // Check for errors in the response
      if (result.error) {
        throw new Error(result.error);
      }

      const outputUrl = result.output;

      if (!outputUrl || !outputUrl.startsWith('http')) {
        throw new Error("Invalid output URL from model");
      }

      // Upload to R2
      const imageKey = generateImageKey(userId, "restored", "png");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);

      // Update image record
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrl,
        },
      });

      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Image restoration failed:", error);

      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Image restoration failed",
      });

      throw error;
    }
  },
});

export const upscaleImage = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
    scale: v.union(v.literal(2), v.literal(4)),
    faceEnhance: v.optional(v.boolean()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl, scale, faceEnhance = false, width, height } = args;
    console.log("Starting GPT-Image upscale with params:", { userId, imageUrl, scale, faceEnhance, width, height });

    // Function to determine the closest supported aspect ratio
    const getAspectRatio = (width: number, height: number): string => {
      const ratio = width / height;

      // Define thresholds for common aspect ratios
      if (Math.abs(ratio - 1) < 0.1) return "1:1";        // Square
      if (Math.abs(ratio - 1.5) < 0.15) return "3:2";     // Horizontal
      if (Math.abs(ratio - 0.667) < 0.1) return "2:3";    // Vertical

      // Default to the closest one
      if (ratio > 1.2) return "3:2";  // More horizontal
      if (ratio < 0.8) return "2:3";  // More vertical
      return "1:1";  // Default to square
    };

    // Validate environment
    if (!process.env.REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Create image record
    const imageId: Id<"images"> = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt: `Upscaled ${scale}x`,
      type: "upscaled",
      model: "gpt-image-1",
      originalImageUrl: imageUrl,
    });

    // Determine aspect ratio (use provided dimensions or default to 1:1)
    const aspectRatio = (width && height) ? getAspectRatio(width, height) : "1:1";
    console.log(`Using aspect ratio: ${aspectRatio} for dimensions ${width}x${height}`);

    try {
      // Call GPT-Image for upscaling
      const response = await fetch(
        "https://api.replicate.com/v1/models/openai/gpt-image-1/predictions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            input: {
              prompt: `Upscale this image ${scale}x with high quality, enhance details and maintain realism${faceEnhance ? ', improve facial features and details' : ''}`,
              quality: "high",
              background: "auto",
              moderation: "auto",
              aspect_ratio: aspectRatio,
              input_images: [imageUrl],
              output_format: "webp",
              input_fidelity: "high",
              openai_api_key: process.env.OPENAI_API_KEY,
              number_of_images: 1,
              output_compression: 90
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Replicate API error response:`, errorText);
        throw new Error(`Replicate API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      let result = await response.json();
      console.log("Initial upscale response:", result);

      // If the prediction is still processing, poll for the result
      if (result.status === 'starting' || result.status === 'processing') {
        const predictionId = result.id;
        const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${predictionId}`,
            {
              headers: {
                "Authorization": `Bearer ${process.env.REPLICATE_API_KEY}`,
              }
            }
          );

          result = await statusResponse.json();
          console.log(`Polling attempt ${attempts + 1}, status: ${result.status}`);

          if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
            break;
          }

          attempts++;
        }
      }

      // Check for errors in the response
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.status === 'failed') {
        throw new Error(result.logs || "Model failed to process the image");
      }

      // The output might be an array or a single URL
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

      if (!outputUrl || !outputUrl.startsWith('http')) {
        throw new Error("Invalid output URL from model");
      }

      // Upload to R2
      const imageKey = generateImageKey(userId, "upscaled", "png");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);

      // Update image record
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrl,
          scale: scale,
          faceEnhance: faceEnhance,
        },
      });

      return {
        imageUrl: permanentUrl,
        imageId,
        scale,
        faceEnhance
      };

    } catch (error) {
      console.error("Error upscaling image:", error);

      // Update image record to failed status
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });

      throw error;
    }
  },
});