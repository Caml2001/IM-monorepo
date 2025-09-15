import { useQuery, useMutation } from "convex/react";
import { api, type Id } from "@my-better-t-app/backend";
import { useCallback } from "react";

/**
 * Hook to get trending images
 */
export function useTrendingImages(date?: string, limit?: number) {
  const images = useQuery(api.trending.getTrending, { date, limit });
  return images || [];
}

/**
 * Hook to track image interactions
 */
export function useImageInteractions() {
  const incrementViewMutation = useMutation(api.trending.incrementView);
  const likeImageMutation = useMutation(api.trending.likeImage);
  const shareImageMutation = useMutation(api.trending.shareImage);
  
  const trackView = useCallback(async (imageId: Id<"images">) => {
    try {
      await incrementViewMutation({ imageId });
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  }, [incrementViewMutation]);
  
  const likeImage = useCallback(async (imageId: Id<"images">, userId: Id<"users">) => {
    try {
      await likeImageMutation({ imageId, userId });
    } catch (error) {
      console.error("Failed to like image:", error);
      throw error;
    }
  }, [likeImageMutation]);
  
  const shareImage = useCallback(async (imageId: Id<"images">) => {
    try {
      await shareImageMutation({ imageId });
    } catch (error) {
      console.error("Failed to track share:", error);
    }
  }, [shareImageMutation]);
  
  return { trackView, likeImage, shareImage };
}