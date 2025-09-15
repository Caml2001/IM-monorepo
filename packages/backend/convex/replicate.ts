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
import { uploadImageFromUrl, generateImageKey } from "./lib/r2";
import type { Id } from "./_generated/dataModel";

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
  handler: async (ctx, args) => {
    const { userId, prompt, negativePrompt, quality = "balanced", seed, aspectRatio } = args;
    
    // Create image record in database with pending status
    const imageId = await ctx.runMutation(internal.images.createPending, {
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
 * Remove background from an image
 */
export const removeBackground = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl } = args;
    
    // Create image record
    const imageId = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt: "Background removed",
      type: "bg-removed",
      model: "rembg",
      originalImageUrl: imageUrl,
    });
    
    try {
      const input = {
        image: imageUrl,
        ...DEFAULT_PARAMS.rembg,
      };
      
      console.log("Removing background with rembg");
      
      // Run the model
      const output = await replicate.run(MODELS.backgroundRemoval.rembg as any, { input });
      
      const outputUrl = Array.isArray(output) ? output[0] : output;
      
      if (!outputUrl) {
        throw new Error("No output from model");
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
 * Upscale an image
 */
export const upscaleImage = action({
  args: {
    userId: v.id("users"),
    imageUrl: v.string(),
    scale: v.optional(v.number()),
    enhanceFaces: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl, scale = 2, enhanceFaces = false } = args;
    
    // Create image record
    const imageId = await ctx.runMutation(internal.images.createPending, {
      userId,
      prompt: `Upscaled ${scale}x`,
      type: "upscaled",
      model: enhanceFaces ? "gfpgan" : "esrgan",
      originalImageUrl: imageUrl,
    });
    
    try {
      // Select model based on whether we need face enhancement
      const model = enhanceFaces ? MODELS.upscale.gfpgan : MODELS.upscale.esrgan;
      const params = enhanceFaces ? DEFAULT_PARAMS.gfpgan : DEFAULT_PARAMS.esrgan;
      
      const input = {
        image: imageUrl,
        scale,
        ...params,
      };
      
      console.log("Upscaling with model:", enhanceFaces ? "gfpgan" : "esrgan");
      
      // Run the model
      const output = await replicate.run(model as any, { input });
      
      const outputUrl = Array.isArray(output) ? output[0] : output;
      
      if (!outputUrl) {
        throw new Error("No output from model");
      }
      
      // Upload to R2
      const imageKey = generateImageKey(userId, "upscaled");
      const permanentUrl = await uploadImageFromUrl(outputUrl as string, imageKey);
      
      // Update image record
      await ctx.runMutation(internal.images.updateCompleted, {
        imageId,
        imageUrl: permanentUrl,
        metadata: {
          originalImageUrl: imageUrl,
          scale,
        },
      });
      
      return { success: true, imageId, imageUrl: permanentUrl };
    } catch (error) {
      console.error("Upscaling failed:", error);
      
      await ctx.runMutation(internal.images.updateFailed, {
        imageId,
        error: error instanceof Error ? error.message : "Upscaling failed",
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
  handler: async (ctx, args) => {
    const { userId, imageUrl, prompt, guidanceScale = 7.5 } = args;
    
    // Create image record
    const imageId = await ctx.runMutation(internal.images.createPending, {
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
        guidance_scale: guidanceScale,
        ...DEFAULT_PARAMS.instructPix2Pix,
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