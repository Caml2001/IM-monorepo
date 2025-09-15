import Replicate from "replicate";

// Initialize Replicate client
export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY!,
});

// Model configurations
export const MODELS = {
  // Image generation models
  generation: {
    // Ultra fast - Google Nano Banana (Gemini Flash, ~5 seconds)
    nanoBanana: "google/nano-banana",
    // Fast model - Stable Diffusion 1.5 (very fast, ~2 seconds)
    sd15: "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    // Balanced model - SDXL (good quality, ~10 seconds)
    sdxl: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  },
  
  // Background removal
  backgroundRemoval: {
    rembg: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
  },
  
  // Image upscaling
  upscale: {
    esrgan: "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
    gfpgan: "tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c", // Better for faces
  },
  
  // Image editing
  edit: {
    instructPix2Pix: "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
  },
};

/**
 * Default parameters for different models
 */
export const DEFAULT_PARAMS = {
  nanoBanana: {
    image_input: [],
    output_format: "jpg",
  },
  flux: {
    num_outputs: 1,
    aspect_ratio: "1:1",
    output_format: "png",
    output_quality: 90,
    guidance: 3.5,
    num_inference_steps: 28,
  },
  sdxl: {
    width: 1024,
    height: 1024,
    num_outputs: 1,
    scheduler: "K_EULER",
    num_inference_steps: 25,
    guidance_scale: 7.5,
    prompt_strength: 0.8,
    refine: "expert_ensemble_refiner",
    high_noise_frac: 0.8,
  },
  sd15: {
    prompt: "", // Required
    width: 512,
    height: 512,
    num_outputs: 1,
    num_inference_steps: 25,
    guidance_scale: 7.5,
  },
  playground: {
    prompt: "", // Required
    width: 1024,
    height: 1024,
    num_outputs: 1,
    scheduler: "DPMSolver++",
    num_inference_steps: 25,
    guidance_scale: 3,
    apply_watermark: false,
  },
  esrgan: {
    scale: 2,
    face_enhance: false,
  },
  gfpgan: {
    scale: 2,
    version: "v1.4",
  },
  rembg: {
    model: "u2net",
    return_mask: false,
    alpha_matting: true,
    alpha_matting_foreground_threshold: 240,
    alpha_matting_background_threshold: 50,
    alpha_matting_erode_size: 10,
  },
  instructPix2Pix: {
    num_outputs: 1,
    num_inference_steps: 25,
    guidance_scale: 7.5,
    image_guidance_scale: 1.5,
  },
};

/**
 * Helper to select the best model based on requirements
 */
export function selectGenerationModel(
  quality: "fast" | "balanced" | "high" = "balanced"
): { model: string; params: any } {
  // For now, always use nano-banana as it's fast and reliable
  return {
    model: MODELS.generation.nanoBanana,
    params: DEFAULT_PARAMS.nanoBanana,
  };
  
  // Alternative selection logic for future:
  // switch (quality) {
  //   case "fast":
  //     return {
  //       model: MODELS.generation.nanoBanana,
  //       params: DEFAULT_PARAMS.nanoBanana,
  //     };
  //   case "high":
  //     return {
  //       model: MODELS.generation.sdxl,
  //       params: DEFAULT_PARAMS.sdxl,
  //     };
  //   case "balanced":
  //   default:
  //     return {
  //       model: MODELS.generation.sd15,
  //       params: DEFAULT_PARAMS.sd15,
  //     };
  // }
}

/**
 * Wait for a Replicate prediction to complete
 */
export async function waitForPrediction(predictionId: string): Promise<any> {
  let prediction = await replicate.predictions.get(predictionId);
  
  while (
    prediction.status === "starting" ||
    prediction.status === "processing"
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    prediction = await replicate.predictions.get(predictionId);
  }
  
  if (prediction.status === "failed") {
    throw new Error(`Prediction failed: ${prediction.error}`);
  }
  
  return prediction;
}