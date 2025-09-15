import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get trending images for a specific date
 */
export const getTrending = query({
  args: {
    date: v.optional(v.string()), // Format: "2024-01-15"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const date = args.date || today;
    const limit = args.limit || 20;
    
    // Get trending entries for the date
    const trendingEntries = await ctx.db
      .query("trending")
      .withIndex("by_date_score", (q) => q.eq("date", date))
      .order("desc")
      .take(limit);
    
    // Fetch the actual images with user data
    const images = await Promise.all(
      trendingEntries.map(async (entry) => {
        const image = await ctx.db.get(entry.imageId);
        if (!image) return null;
        
        const user = await ctx.db.get(image.userId);
        
        return {
          ...image,
          userName: user?.name || "Anonymous",
          userImage: user?.image,
          trendingScore: entry.score,
          views: entry.views,
          likes: entry.likes,
          shares: entry.shares,
        };
      })
    );
    
    // Filter out null entries
    return images.filter(Boolean);
  },
});

/**
 * Increment view count for an image
 */
export const incrementView = mutation({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create trending entry
    const existing = await ctx.db
      .query("trending")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .filter((q) => q.eq(q.field("date"), today))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        views: existing.views + 1,
        score: calculateScore(existing.views + 1, existing.likes, existing.shares),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("trending", {
        imageId: args.imageId,
        date: today,
        views: 1,
        likes: 0,
        shares: 0,
        score: calculateScore(1, 0, 0),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Like an image
 */
export const likeImage = mutation({
  args: {
    imageId: v.id("images"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create trending entry
    const existing = await ctx.db
      .query("trending")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .filter((q) => q.eq(q.field("date"), today))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        likes: existing.likes + 1,
        score: calculateScore(existing.views, existing.likes + 1, existing.shares),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("trending", {
        imageId: args.imageId,
        date: today,
        views: 0,
        likes: 1,
        shares: 0,
        score: calculateScore(0, 1, 0),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Share an image
 */
export const shareImage = mutation({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find or create trending entry
    const existing = await ctx.db
      .query("trending")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .filter((q) => q.eq(q.field("date"), today))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        shares: existing.shares + 1,
        score: calculateScore(existing.views, existing.likes, existing.shares + 1),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("trending", {
        imageId: args.imageId,
        date: today,
        views: 0,
        likes: 0,
        shares: 1,
        score: calculateScore(0, 0, 1),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Calculate trending score
 * Weights: views = 1, likes = 5, shares = 10
 */
function calculateScore(views: number, likes: number, shares: number): number {
  return views + (likes * 5) + (shares * 10);
}