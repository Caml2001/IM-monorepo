import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { useTheme } from "heroui-native";

export default function MainLayout() {
	const { standard } = useNavigationOptions();
	const { colors } = useTheme();
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Home",
					headerTitle: "",
					headerBackTitle: "Home",
					...standard,
				}}
			/>
			<Stack.Screen
				name="settings"
				options={{
					title: "Settings",
					headerLargeTitle: true,
					...standard,
				}}
			/>
			<Stack.Screen
				name="(studio)"
				options={{
					headerShown: true,
					headerTransparent: true,
					headerBackTitle: "",
					title: "",
				}}
			/>
			<Stack.Screen
				name="viewer"
				options={{
					headerShown: true,
					headerTransparent: true,
					headerBackTitle: "",
					title: "",
				}}
			/>
			<Stack.Screen
				name="library"
				options={{
					title: "Library",
					headerLargeTitle: true,
					...standard,
				}}
			/>
			<Stack.Screen
				name="trends"
				options={{
					title: "Trends",
					headerLargeTitle: true,
					...standard,
				}}
			/>
		</Stack>
	);
}
