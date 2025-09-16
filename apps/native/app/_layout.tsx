import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import ConvexProvider from "@/providers/ConvexProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

/* ------------------------------ themed route ------------------------------ */
function ThemedLayout() {
  const { currentTheme } = useAppTheme();
  const themeValue = useSharedValue(currentTheme === "dark" ? 1 : 0);

  useEffect(() => {
    themeValue.value = withTiming(currentTheme === "dark" ? 1 : 0, {
      duration: 200,
    });
  }, [currentTheme]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      backgroundColor: interpolateColor(
        themeValue.value,
        [0, 1],
        ["#ffffff", "#030712"]
      ),
    };
  });

  return (
    <Animated.View
      className={currentTheme === "dark" ? "dark" : ""}
      style={animatedStyle}
    >
      <HeroUINativeProvider
        config={{
          colorScheme: currentTheme,
          textProps: {
            allowFontScaling: false,
          },
        }}
      >
        <Slot />
      </HeroUINativeProvider>
    </Animated.View>
  );
}
/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
  return (
    <ConvexProvider>
      <SplashScreenProvider>
        <GestureHandlerRootView className="flex-1">
          <SafeAreaProvider>
            <AppThemeProvider>
              <ThemedLayout />
            </AppThemeProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </SplashScreenProvider>
    </ConvexProvider>
  );
}
