import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "heroui-native";
import { AppText } from "./app-text";
import { useAppTheme } from "@/contexts/app-theme-context";

export function Label({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <AppText style={{ color: colors.mutedForeground }} className="text-sm">
      {children}
    </AppText>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="rounded-2xl border px-4 py-3 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
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
      className={`rounded-full border px-3 py-2 ${
        selected
          ? 'bg-blue-500 border-blue-500'
          : 'bg-transparent border-gray-300 dark:border-zinc-700'
      }`}
    >
      <AppText
        className={`text-sm font-medium ${
          selected
            ? 'text-white'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
