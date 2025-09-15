import { useQuery, useMutation } from "convex/react";
import { api, type Id } from "@my-better-t-app/backend";
import { useCallback, useEffect } from "react";

/**
 * Hook to get current user with all data
 */
export function useCurrentUser() {
  const userData = useQuery(api.users.getAllUserDataQuery);
  const initializeCredits = useMutation(api.users.initializeCredits);
  
  // Initialize credits if needed
  useEffect(() => {
    if (userData?.user && userData.user._id && userData.user.credits === undefined) {
      initializeCredits({ userId: userData.user._id }).catch(console.error);
    }
  }, [userData?.user, initializeCredits]);
  
  return {
    user: userData?.user,
    userMetaData: userData?.userMetaData,
    isLoading: userData === undefined,
    isAuthenticated: !!userData?.user,
  };
}

/**
 * Hook to get user credits
 */
export function useUserCredits(userId: Id<"users"> | undefined) {
  const credits = useQuery(
    api.users.getCredits,
    userId ? { userId } : "skip"
  );
  
  return credits ?? 0;
}

/**
 * Hook to use credits
 */
export function useCredits() {
  const useCreditsMutation = useMutation(api.users.useCredits);
  const addCreditsMutation = useMutation(api.users.addCredits);
  
  const useCredits = useCallback(async (userId: Id<"users">, amount: number = 1) => {
    try {
      const result = await useCreditsMutation({ userId, amount });
      return result;
    } catch (error) {
      console.error("Failed to use credits:", error);
      throw error;
    }
  }, [useCreditsMutation]);
  
  const addCredits = useCallback(async (userId: Id<"users">, amount: number) => {
    try {
      const result = await addCreditsMutation({ userId, amount });
      return result;
    } catch (error) {
      console.error("Failed to add credits:", error);
      throw error;
    }
  }, [addCreditsMutation]);
  
  return { useCredits, addCredits };
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const updateMutation = useMutation(api.users.updateProfile);
  
  const updateProfile = useCallback(async (params: {
    userId: Id<"users">;
    name?: string;
    image?: string;
  }) => {
    try {
      await updateMutation(params);
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  }, [updateMutation]);
  
  return updateProfile;
}