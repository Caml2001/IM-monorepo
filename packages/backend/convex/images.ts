import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Internal mutation to create a pending image record
 */
export const createPending = internalMutation({
  args: {
    userId: v.id("users"),
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    type: v.string(),
    model: v.string(),
    originalImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const imageId = await ctx.db.insert("images", {
      userId: args.userId,
      prompt: args.prompt,
      negativePrompt: args.negativePrompt,
      imageUrl: "", // Will be updated when complete
      model: args.model,
      type: args.type,
      metadata: args.originalImageUrl ? { originalImageUrl: args.originalImageUrl } : undefined,
      status: "processing",
      createdAt: now,
      updatedAt: now,
    });
    
    return imageId;
  },
});

/**
 * Internal mutation to update image as completed
 */
export const updateCompleted = internalMutation({
  args: {
    imageId: v.id("images"),
    imageUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      seed: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      scale: v.optional(v.number()),
      originalImageUrl: v.optional(v.string()),
      replicateId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.imageId);
    if (!existing) throw new Error("Image not found");
    
    await ctx.db.patch(args.imageId, {
      imageUrl: args.imageUrl,
      thumbnailUrl: args.thumbnailUrl,
      metadata: {
        ...existing.metadata,
        ...args.metadata,
      },
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to update image as failed
 */
export const updateFailed = internalMutation({
  args: {
    imageId: v.id("images"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get all images for a user
 */
export const listUserImages = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, type, limit = 50 } = args;
    
    let query = ctx.db
      .query("images")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "completed"));
    
    if (type) {
      query = query.filter((q) => q.eq(q.field("type"), type));
    }
    
    const images = await query
      .order("desc")
      .take(limit);
    
    return images;
  },
});

/**
 * Get a single image by ID
 */
export const getImage = query({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.imageId);
  },
});

/**
 * Get recent images (for home/explore)
 */
export const getRecentImages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 20 } = args;
    
    const images = await ctx.db
      .query("images")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(limit);
    
    // Join with user data
    const imagesWithUsers = await Promise.all(
      images.map(async (image) => {
        const user = await ctx.db.get(image.userId);
        return {
          ...image,
          userName: user?.name || "Anonymous",
          userImage: user?.image,
        };
      })
    );
    
    return imagesWithUsers;
  },
});

/**
 * Delete an image
 */
export const deleteImage = mutation({
  args: {
    imageId: v.id("images"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    
    if (!image) {
      throw new Error("Image not found");
    }
    
    if (image.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    
    // TODO: Also delete from R2 if needed
    
    await ctx.db.delete(args.imageId);
    
    return { success: true };
  },
});

/**
 * Get image statistics for a user
 */
export const getUserStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("images")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const stats = {
      total: images.length,
      generated: images.filter(img => img.type === "generated").length,
      edited: images.filter(img => img.type === "edited").length,
      upscaled: images.filter(img => img.type === "upscaled").length,
      bgRemoved: images.filter(img => img.type === "bg-removed").length,
      completed: images.filter(img => img.status === "completed").length,
      processing: images.filter(img => img.status === "processing").length,
      failed: images.filter(img => img.status === "failed").length,
    };
    
    return stats;
  },
});

/**
 * Search images by prompt
 */
export const searchImages = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, searchTerm } = args;
    const searchLower = searchTerm.toLowerCase();
    
    const images = await ctx.db
      .query("images")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    
    // Filter by prompt containing search term
    const filtered = images.filter(image => 
      image.prompt.toLowerCase().includes(searchLower) ||
      (image.negativePrompt && image.negativePrompt.toLowerCase().includes(searchLower))
    );
    
    return filtered;
  },
});