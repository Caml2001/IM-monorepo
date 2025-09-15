import { useQuery, useMutation, useAction } from "convex/react";
import { api, type Id } from "@my-better-t-app/backend";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

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
 * Hook to upscale images
 */
export function useUpscaleImage() {
  const upscaleAction = useAction(api.replicate.upscaleImage);
  const [isUpscaling, setIsUpscaling] = useState(false);
  
  const upscale = useCallback(async (params: {
    userId: Id<"users">;
    imageUrl: string;
    scale?: number;
    enhanceFaces?: boolean;
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