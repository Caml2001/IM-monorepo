import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	/**
	 * in the dashboard -> components -> better-auth
	 * the real user table is there when a user is created
	 *
	 * this is only the forward facing table
	 *
	 * you can edit this as you want this to be
	 */
	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		credits: v.optional(v.number()),
		tier: v.optional(v.string()), // "free" | "pro" | "premium"
	}),
	
	// Images generated or processed by users
	images: defineTable({
		userId: v.id("users"),
		prompt: v.string(),
		negativePrompt: v.optional(v.string()),
		imageUrl: v.string(), // R2 URL
		thumbnailUrl: v.optional(v.string()),
		model: v.string(), // "flux", "sdxl", etc.
		type: v.string(), // "generated", "edited", "upscaled", "bg-removed"
		metadata: v.optional(v.object({
			seed: v.optional(v.number()),
			width: v.optional(v.number()),
			height: v.optional(v.number()),
			steps: v.optional(v.number()),
			originalImageUrl: v.optional(v.string()),
			replicateId: v.optional(v.string()),
		})),
		status: v.string(), // "pending", "processing", "completed", "failed"
		error: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_status", ["status"])
		.index("by_type", ["type"]),
	
	// Collections for organizing images
	collections: defineTable({
		userId: v.id("users"),
		name: v.string(),
		description: v.optional(v.string()),
		coverImageId: v.optional(v.id("images")),
		isPublic: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"]),
	
	// Many-to-many relationship between collections and images
	collectionImages: defineTable({
		collectionId: v.id("collections"),
		imageId: v.id("images"),
		order: v.number(),
		addedAt: v.number(),
	})
		.index("by_collection", ["collectionId"])
		.index("by_image", ["imageId"]),
	
	// Trending/popular images
	trending: defineTable({
		imageId: v.id("images"),
		score: v.number(), // popularity score
		views: v.number(),
		likes: v.number(),
		shares: v.number(),
		date: v.string(), // "2024-01-15" for daily trending
		updatedAt: v.number(),
	})
		.index("by_date_score", ["date", "score"])
		.index("by_image", ["imageId"]),
});
