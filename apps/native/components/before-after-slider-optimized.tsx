import React, { useCallback } from "react";
import {
  View,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useTheme } from "heroui-native";
import { Icon } from "./Icon";
import { AppText } from "./app-text";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  width?: number;
}

export function BeforeAfterSliderOptimized({
  beforeImage,
  afterImage,
  height = 400,
  width,
}: BeforeAfterSliderProps) {
  const { colors } = useTheme();
  const screenWidth = width || Dimensions.get("window").width - 32;

  // Shared value for slider position
  const translateX = useSharedValue(screenWidth / 2);
  const startX = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Create pan gesture using the new API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      // Update position with clamping
      translateX.value = Math.max(
        0,
        Math.min(startX.value + event.translationX, screenWidth)
      );
    })
    .onEnd(() => {
      // Add spring effect on release
      translateX.value = withSpring(translateX.value, {
        damping: 15,
        stiffness: 150,
      });
      runOnJS(triggerHaptic)();
    });

  // Animated style for the before image mask
  const animatedMaskStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value,
    };
  });

  // Animated style for the slider handle
  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value - 20 }], // Offset to center
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 0 }}>
      <View style={[styles.container, { height, width: screenWidth }]}>
        {/* After Image (full width) - Bottom layer */}
        <Image
          source={{ uri: afterImage }}
          style={[styles.image, { width: screenWidth, height }]}
          resizeMode="cover"
        />

        {/* Before Image (clipped) - Top layer */}
        <Animated.View
          style={[
            styles.beforeContainer,
            { height },
            animatedMaskStyle,
          ]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: beforeImage }}
            style={[styles.image, { width: screenWidth, height }]}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Slider Handle - Interactive layer */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sliderContainer,
              { height },
              animatedSliderStyle,
            ]}
          >
            {/* Vertical Line */}
            <View
              style={[
                styles.sliderLine,
                {
                  backgroundColor: colors.background,
                  height: "100%",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                },
              ]}
            />

            {/* Handle Circle */}
            <View
              style={[
                styles.sliderHandle,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="swap-horizontal" size={20} color={colors.foreground} />
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Labels */}
        <View style={styles.labelContainer} pointerEvents="none">
          <View
            style={[
              styles.label,
              {
                backgroundColor: colors.background + "E6",
                left: 12,
              },
            ]}
          >
            <AppText style={[styles.labelText, { color: colors.foreground }]}>
              Before
            </AppText>
          </View>
          <View
            style={[
              styles.label,
              {
                backgroundColor: colors.background + "E6",
                right: 12,
              },
            ]}
          >
            <AppText style={[styles.labelText, { color: colors.foreground }]}>
              After
            </AppText>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#000",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  beforeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  sliderContainer: {
    position: "absolute",
    top: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderLine: {
    width: 4,
    position: "absolute",
    left: 18,
  },
  sliderHandle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
  },
});