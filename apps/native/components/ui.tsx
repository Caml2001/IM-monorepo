import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "heroui-native";
import { AppText } from "./app-text";

export function Label({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <AppText style={{ color: colors.mutedForeground }} className="text-sm">
      {children}
    </AppText>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
      className="rounded-2xl border px-4 py-3"
    >
      {children}
    </View>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <AppText style={{ color: colors.mutedForeground }} className="text-xs">
      {children}
    </AppText>
  );
}

export function ChipOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderColor: selected ? "#ffffff" : colors.border,
        backgroundColor: selected ? "#ffffff" : "transparent",
      }}
      className="rounded-full border px-3 py-2"
    >
      <AppText
        style={{ color: selected ? "#000000" : colors.foreground }}
        className="text-sm font-medium"
      >
        {label}
      </AppText>
    </Pressable>
  );
}
