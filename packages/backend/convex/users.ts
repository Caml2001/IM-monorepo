import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import * as Users from "./model/user";

/**
 * this will return
 * user public table -- if being used
 * user meta data from better auth component
 * Returns null if user is not authenticated or has been deleted
 */
export const getAllUserDataQuery = query({
	args: {},
	returns: v.union(
		v.object({
			user: v.any(),
			userMetaData: v.any(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const userData = await Users.getAllUserData(ctx);
		
		// Return user data with default credits if not set
		if (userData?.user) {
			const credits = userData.user.credits ?? 10;
			const tier = userData.user.tier ?? "free";
			const themePreference = userData.user.themePreference ?? "system";
			return {
				...userData,
				user: {
					...userData.user,
					credits,
					tier,
					themePreference,
				},
			};
		}
		
		return userData;
	},
});

/**
 * Initialize user credits if not set
 */
export const initializeCredits = mutation({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");
		
		if (user.credits === undefined) {
			await ctx.db.patch(args.userId, {
				credits: 10,
				tier: "free",
			});
			return { credits: 10, tier: "free" };
		}
		
		return { credits: user.credits, tier: user.tier || "free" };
	},
});

/**
 * Get user credits
 */
export const getCredits = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) return 0;
		return user.credits || 0;
	},
});

/**
 * Use credits for generation
 */
export const useCredits = mutation({
	args: {
		userId: v.id("users"),
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");
		
		const currentCredits = user.credits || 0;
		if (currentCredits < args.amount) {
			throw new Error("Insufficient credits");
		}
		
		await ctx.db.patch(args.userId, {
			credits: currentCredits - args.amount,
		});
		
		return { remainingCredits: currentCredits - args.amount };
	},
});

/**
 * Add credits to user account
 */
export const addCredits = mutation({
	args: {
		userId: v.id("users"),
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");
		
		const currentCredits = user.credits || 0;
		
		await ctx.db.patch(args.userId, {
			credits: currentCredits + args.amount,
		});
		
		return { newCredits: currentCredits + args.amount };
	},
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
	args: {
		userId: v.id("users"),
		name: v.optional(v.string()),
		image: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { userId, ...updates } = args;

		const user = await ctx.db.get(userId);
		if (!user) throw new Error("User not found");

		await ctx.db.patch(userId, updates);

		return { success: true };
	},
});

/**
 * Update theme preference
 */
export const updateThemePreference = mutation({
	args: {
		userId: v.id("users"),
		theme: v.union(v.literal("system"), v.literal("dark"), v.literal("light")),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");

		await ctx.db.patch(args.userId, {
			themePreference: args.theme,
		});

		return { success: true, theme: args.theme };
	},
});
