import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./app-text";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

// Try to use expo-glass-effect for iOS 26 Liquid Glass; fallback to plain View
let GlassView: any = View;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("expo-glass-effect");
  GlassView = mod.GlassView ?? View;
} catch {}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  create: "color-wand-outline",
  edit: "brush-outline",
  scale: "expand-outline",
  restore: "refresh-outline",
};

export function StudioTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: insets.bottom + 6, paddingTop: 8, paddingHorizontal: 12 }}>
      {/* Glass background */}
      <GlassView
        // @ts-expect-error: prop exists on GlassView
        glassEffectStyle="regular"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        pointerEvents="none"
      />
      <View className="flex-row items-center justify-between gap-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          const iconName = ICONS[route.name] ?? ("ellipse-outline" as const);

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              className={`flex-1 items-center gap-1 rounded-2xl px-3 py-2 ${
                isFocused ? "bg-primary/10" : ""
              }`}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
            >
              <Ionicons
                name={iconName}
                size={20}
                color={isFocused ? "#007AFF" : "#6b7280"}
              />
              <AppText
                className={`text-[12px] ${
                  isFocused ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
