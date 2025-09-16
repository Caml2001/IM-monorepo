import { Ionicons } from "@expo/vector-icons";
import { Button, Spinner, useTheme } from "heroui-native";
import { useState, useEffect } from "react";
import { Alert, ScrollView, View, Text, Pressable } from "react-native";
import { authClient } from "@/lib/better-auth/auth-client";
import { Icon } from "@/components/Icon";
import { Section, Label } from "@/components/ui";
import * as Haptics from "expo-haptics";
import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useAppTheme, type ThemeMode } from "@/contexts/app-theme-context";

export default function SettingsRoute() {
	const { colors } = useTheme();
	const { themeMode, setThemeMode, currentTheme } = useAppTheme();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [isDeletingUser, setIsDeletingUser] = useState(false);

	// Get user data including theme preference
	const userData = useQuery(api.users.getAllUserDataQuery);
	const updateTheme = useMutation(api.users.updateThemePreference);

	// Load theme preference from backend
	useEffect(() => {
		if (userData?.user?.themePreference) {
			const savedTheme = userData.user.themePreference as ThemeMode;
			if (savedTheme !== themeMode) {
				setThemeMode(savedTheme);
			}
		}
	}, [userData?.user?.themePreference]);
	// sign out
	const handleSignOut = async () => {
		const { error, data } = await authClient.signOut(
			{},
			{
				onRequest: () => {
					setIsSigningOut(true);
				},
				onSuccess: () => {
					setIsSigningOut(false);
					console.log("Sign out successful");
				},
				onError: (ctx) => {
					console.error(ctx.error);
					Alert.alert("Error", ctx.error.message || "Failed to sign out");
				},
			},
		);

		console.log(data, error);
	};
	// delete user
	const handleDeleteUser = async () => {
		const { error, data } = await authClient.deleteUser(
			{},
			{
				onRequest: () => {
					setIsDeletingUser(true);
				},
				onSuccess: () => {
					console.log("User deleted successfully");
					setIsDeletingUser(false);
					// The auth system will automatically handle the redirect
				},
				onError: (ctx) => {
					setIsDeletingUser(false);
					console.error(ctx.error);
					Alert.alert("Error", ctx.error.message || "Failed to delete user");
				},
			},
		);

		console.log(data, error);
	};

	const themeOptions = [
		{ value: "system" as const, label: "System", icon: "phone-portrait-outline" as const },
		{ value: "dark" as const, label: "Dark", icon: "moon-outline" as const },
		{ value: "light" as const, label: "Light", icon: "sunny-outline" as const },
	];

	const handleThemeSelect = async (theme: ThemeMode) => {
		if (theme !== themeMode) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setThemeMode(theme);

			// Save to backend if user is authenticated
			if (userData?.user?._id) {
				try {
					await updateTheme({
						userId: userData.user._id,
						theme: theme,
					});
				} catch (error) {
					console.error("Failed to update theme preference:", error);
					// Optionally revert the change if the update fails
					setThemeMode((userData.user.themePreference || "system") as ThemeMode);
				}
			}
		}
	};

	return (
		<ScrollView
			automaticallyAdjustsScrollIndicatorInsets
			contentInsetAdjustmentBehavior="always"
			contentContainerClassName="px-4 py-4 gap-4"
		>
			{/* Theme Selector */}
			<Section>
				<View className="gap-4">
					<View className="flex-row items-center justify-between">
						<Label>Appearance</Label>
						<Text className="text-xs" style={{ color: colors.mutedForeground }}>
							{themeOptions.find(opt => opt.value === themeMode)?.label}
						</Text>
					</View>
					<View className="flex-row gap-2">
						{themeOptions.map((option, index) => (
							<Pressable
								key={option.value}
								onPress={() => handleThemeSelect(option.value)}
								className="flex-1"
							>
								<View
									className={`items-center justify-center py-3 rounded-xl border ${
										themeMode === option.value
											? 'bg-blue-500 border-blue-500'
											: 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
									}`}
								>
									<Icon
										name={option.icon}
										size={20}
										color={themeMode === option.value ? '#ffffff' : colors.foreground}
									/>
									<Text
										className={`text-xs mt-1.5 font-semibold ${
											themeMode === option.value
												? 'text-white'
												: 'text-gray-900 dark:text-white'
										}`}
									>
										{option.label}
									</Text>
								</View>
							</Pressable>
						))}
					</View>
				</View>
			</Section>

			{/*Sign Out*/}
			<Button
				className="rounded-full"
				variant="tertiary"
				disabled={isSigningOut}
				onPress={() => {
					Alert.alert("Sign Out", "Are you sure you want to sign out", [
						{
							text: "Cancel",
							style: "cancel",
						},
						{
							text: "Sign Out",
							onPress: async () => {
								await handleSignOut();
							},
						},
					]);
				}}
			>
				<Button.StartContent>
					<Ionicons
						name="log-out-outline"
						size={18}
						color={colors.foreground}
					/>
				</Button.StartContent>
				<Button.LabelContent>
					{isSigningOut ? "Signing Out..." : "Sign Out"}
				</Button.LabelContent>
				<Button.EndContent>
					{isSigningOut ? <Spinner color={colors.foreground} /> : null}
				</Button.EndContent>
			</Button>
			{/* Delete User*/}
			<Button
				variant="tertiary"
				className="rounded-full"
				disabled={isDeletingUser}
				onPress={async () => {
					Alert.alert(
						"Delete User",
						"Are you sure you want to delete your account?",
						[
							{
								text: "Cancel",
								style: "cancel",
							},
							{
								text: "Delete",
								onPress: async () => {
									await handleDeleteUser();
								},
							},
						],
					);
				}}
			>
				<Button.StartContent>
					<Ionicons name="trash-outline" size={18} color={colors.foreground} />
				</Button.StartContent>
				<Button.LabelContent>
					{isDeletingUser ? "Deleting..." : "Delete User"}
				</Button.LabelContent>
				<Button.EndContent>
					{isDeletingUser ? <Spinner color={colors.foreground} /> : null}
				</Button.EndContent>
			</Button>
		</ScrollView>
	);
}
