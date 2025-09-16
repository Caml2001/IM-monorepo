import type React from "react";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	useCallback,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

interface AppThemeContextType {
	themeMode: ThemeMode;
	setThemeMode: (mode: ThemeMode) => void;
	currentTheme: "light" | "dark";
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(
	undefined,
);

const THEME_KEY = "@app-theme-mode";

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const systemColorScheme = useRNColorScheme();
	const { colorScheme, setColorScheme } = useColorScheme();
	const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
	const [isLoaded, setIsLoaded] = useState(false);

	// Load saved theme preference
	useEffect(() => {
		AsyncStorage.getItem(THEME_KEY).then((savedTheme) => {
			if (savedTheme) {
				const mode = savedTheme as ThemeMode;
				setThemeModeState(mode);
				// Apply the saved theme immediately
				if (mode === "system") {
					setColorScheme("system");
				} else {
					setColorScheme(mode);
				}
			}
			setIsLoaded(true);
		});
	}, [setColorScheme]);

	const setThemeMode = useCallback(async (mode: ThemeMode) => {
		setThemeModeState(mode);
		await AsyncStorage.setItem(THEME_KEY, mode);

		// Apply theme immediately
		if (mode === "system") {
			setColorScheme("system");
		} else {
			setColorScheme(mode);
		}
	}, [setColorScheme]);

	const currentTheme = useMemo(() => {
		if (themeMode === "system") {
			return systemColorScheme || "light";
		}
		return themeMode;
	}, [themeMode, systemColorScheme]);

	const value = useMemo(
		() => ({
			themeMode,
			setThemeMode,
			currentTheme,
		}),
		[themeMode, currentTheme, setThemeMode],
	);

	return (
		<AppThemeContext.Provider value={value}>
			{children}
		</AppThemeContext.Provider>
	);
};

export const useAppTheme = () => {
	const context = useContext(AppThemeContext);
	if (!context) {
		throw new Error("useAppTheme must be used within AppThemeProvider");
	}
	return context;
};
