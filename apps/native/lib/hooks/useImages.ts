import { useQuery, useMutation, useAction } from "convex/react";
import { api, type Id } from "@my-better-t-app/backend";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

/**
 * Hook to upload local images to R2
 */
export function useUploadImage() {
  const uploadAction = useAction(api.replicate.uploadImage);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadImage = useCallback(async (userId: Id<"users">, imageUri: string) => {
    setIsUploading(true);
    try {
      // If it's already an HTTP URL, return it as is
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        return imageUri;
      }
      
      // Convert image to base64 using fetch
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove the data:image/xxx;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Determine content type from blob
      const contentType = blob.type || 'image/jpeg';
      
      // Upload to R2
      const result = await uploadAction({
        userId,
        base64Data,
        contentType,
      });
      
      return result.imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [uploadAction]);
  
  return { uploadImage, isUploading };
}

/**
 * Hook to enhance prompts using AI
 */
export function useEnhancePrompt() {
  const enhanceAction = useAction(api.replicate.enhancePrompt);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const enhancePrompt = useCallback(async (imageUrls: string[], userPrompt?: string) => {
    setIsEnhancing(true);
    try {
      const result = await enhanceAction({
        imageUrls,
        userPrompt,
      });
      return result;
    } catch (error) {
      console.error("Prompt enhancement failed:", error);
      // Don't show alert for enhancement failures, just return original
      return {
        success: false,
        enhancedPrompt: userPrompt || "",
        originalPrompt: userPrompt
      };
    } finally {
      setIsEnhancing(false);
    }
  }, [enhanceAction]);
  
  return { enhancePrompt, isEnhancing };
}

/**
 * Hook to generate images
 */
export function useGenerateImage() {
  const generateAction = useAction(api.replicate.generateImage);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generate = useCallback(async (params: {
    userId: Id<"users">;
    prompt: string;
    negativePrompt?: string;
    quality?: "fast" | "balanced" | "high";
    seed?: number;
    aspectRatio?: string;
  }) => {
    setIsGenerating(true);
    try {
      const result = await generateAction(params);
      return result;
    } catch (error) {
      console.error("Generation failed:", error);
      Alert.alert("Generation Failed", error instanceof Error ? error.message : "Failed to generate image");
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [generateAction]);
  
  return { generate, isGenerating };
}

/**
 * Hook to remove background from images
 */
export function useRemoveBackground() {
  const removeAction = useAction(api.replicate.removeBackground);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const removeBackground = useCallback(async (params: {
    userId: Id<"users">;
    imageUrl: string;
    preservePartialAlpha?: boolean;
  }) => {
    setIsProcessing(true);
    try {
      const result = await removeAction(params);
      return result;
    } catch (error) {
      console.error("Background removal failed:", error);
      Alert.alert("Processing Failed", error instanceof Error ? error.message : "Failed to remove background");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [removeAction]);
  
  return { removeBackground, isProcessing };
}

/**
 * Hook to mix multiple images
 */
export function useMixImages() {
  const mixAction = useAction(api.replicate.mixImages);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mixImages = useCallback(async (params: {
    userId: Id<"users">;
    imageUrls: string[];
    prompt?: string;
    negativePrompt?: string;
    seed?: number;
  }) => {
    setIsProcessing(true);
    try {
      const result = await mixAction(params);
      return result;
    } catch (error) {
      console.error("Image mixing failed:", error);
      Alert.alert("Processing Failed", error instanceof Error ? error.message : "Failed to mix images");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [mixAction]);
  
  return { mixImages, isProcessing };
}

/**
 * Hook to upscale images
 */
export function useUpscaleImage() {
  const upscaleAction = useAction(api.replicate.upscaleImage);
  const [isUpscaling, setIsUpscaling] = useState(false);

  const upscale = useCallback(async (params: {
    userId: Id<"users">;
    imageUrl: string;
    scale: 2 | 4;
    faceEnhance?: boolean;
    width?: number;
    height?: number;
  }) => {
    setIsUpscaling(true);
    try {
      const result = await upscaleAction(params);
      return result;
    } catch (error) {
      console.error("Upscaling failed:", error);
      Alert.alert("Upscaling Failed", error instanceof Error ? error.message : "Failed to upscale image");
      throw error;
    } finally {
      setIsUpscaling(false);
    }
  }, [upscaleAction]);

  return { upscale, isUpscaling };
}

/**
 * Hook to edit images with prompts
 */
export function useEditImage() {
  const editAction = useAction(api.replicate.editImage);
  const [isEditing, setIsEditing] = useState(false);
  
  const edit = useCallback(async (params: {
    userId: Id<"users">;
    imageUrl: string;
    prompt: string;
    guidanceScale?: number;
  }) => {
    setIsEditing(true);
    try {
      const result = await editAction(params);
      return result;
    } catch (error) {
      console.error("Edit failed:", error);
      Alert.alert("Edit Failed", error instanceof Error ? error.message : "Failed to edit image");
      throw error;
    } finally {
      setIsEditing(false);
    }
  }, [editAction]);
  
  return { edit, isEditing };
}

/**
 * Hook to restore images
 */
export function useRestoreImage() {
  const restoreAction = useAction(api.replicate.restoreImage);
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = useCallback(async (params: {
    userId: Id<"users">;
    imageUrl: string;
    safetyTolerance?: 0 | 1 | 2;
  }) => {
    setIsRestoring(true);
    try {
      const result = await restoreAction(params);
      return result;
    } catch (error) {
      console.error("Restore failed:", error);
      Alert.alert("Restore Failed", error instanceof Error ? error.message : "Failed to restore image");
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [restoreAction]);

  return { restore, isRestoring };
}

/**
 * Hook to get user's images
 */
export function useUserImages(userId: Id<"users"> | undefined, type?: string) {
  const images = useQuery(
    api.images.listUserImages,
    userId ? { userId, type } : "skip"
  );

  return images || [];
}

/**
 * Hook to get recent images
 */
export function useRecentImages(limit?: number) {
  const images = useQuery(api.images.getRecentImages, { limit });
  return images || [];
}

/**
 * Hook to get a single image
 */
export function useImage(imageId: Id<"images"> | undefined) {
  const image = useQuery(
    api.images.getImage,
    imageId ? { imageId } : "skip"
  );
  
  return image;
}

/**
 * Hook to delete an image
 */
export function useDeleteImage() {
  const deleteMutation = useMutation(api.images.deleteImage);
  
  const deleteImage = useCallback(async (imageId: Id<"images">, userId: Id<"users">) => {
    try {
      await deleteMutation({ imageId, userId });
      Alert.alert("Success", "Image deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      Alert.alert("Delete Failed", error instanceof Error ? error.message : "Failed to delete image");
      throw error;
    }
  }, [deleteMutation]);
  
  return deleteImage;
}

/**
 * Hook to get user statistics
 */
export function useUserStats(userId: Id<"users"> | undefined) {
  const stats = useQuery(
    api.images.getUserStats,
    userId ? { userId } : "skip"
  );
  
  return stats || {
    total: 0,
    generated: 0,
    edited: 0,
    upscaled: 0,
    bgRemoved: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  };
}

/**
 * Hook to search images
 */
export function useSearchImages(userId: Id<"users"> | undefined, searchTerm: string) {
  const images = useQuery(
    api.images.searchImages,
    userId && searchTerm ? { userId, searchTerm } : "skip"
  );
  
  return images || [];
}