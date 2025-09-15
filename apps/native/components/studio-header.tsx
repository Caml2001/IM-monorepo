import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "heroui-native";
import { View } from "react-native";
import { AppText } from "./app-text";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export function StudioHeader({ icon, title, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <View className="mb-4 mt-2 flex-row items-center gap-3">
      {icon ? <Ionicons name={icon} size={22} color={colors.primary} /> : null}
      <View className="flex-1">
        <AppText className="text-2xl font-bold text-foreground">{title}</AppText>
        {subtitle ? (
          <AppText className="text-sm text-muted-foreground">{subtitle}</AppText>
        ) : null}
      </View>
    </View>
  );
}

