import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "heroui-native";
import * as Haptics from "expo-haptics";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CustomSwitch({ checked, onCheckedChange, disabled = false }: CustomSwitchProps) {
  const { colors } = useTheme();
  const animation = useSharedValue(checked ? 1 : 0);

  React.useEffect(() => {
    animation.value = withSpring(checked ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [checked, animation]);

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCheckedChange(!checked);
  };

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: animation.value * 20,
        },
      ],
    };
  });

  // Use static colors to avoid interpolation issues
  const trackColor = checked ? (colors.primary || "#007AFF") : (colors.muted || "#E5E5E5");

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          padding: 2,
          backgroundColor: trackColor,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.background || "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            },
            animatedThumbStyle,
          ]}
        />
      </View>
    </Pressable>
  );
}