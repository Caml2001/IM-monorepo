import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
  PanResponder,
} from "react-native";
import { useTheme } from "heroui-native";
import { Icon } from "./Icon";
import { AppText } from "./app-text";
import * as Haptics from "expo-haptics";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: number;
  width?: number;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  height = 400,
  width,
}: BeforeAfterSliderProps) {
  const { colors } = useTheme();
  const screenWidth = width || Dimensions.get("window").width - 32;

  // Use Animated.Value for smooth animations
  const pan = useRef(new Animated.Value(screenWidth / 2)).current;
  const [currentPosition, setCurrentPosition] = useState(screenWidth / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Haptic feedback on touch
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Extract the current value
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan }],
        {
          useNativeDriver: false,
          listener: (event: any, gestureState: any) => {
            // Calculate new position
            const newPosition = currentPosition + gestureState.dx;
            // Clamp between 0 and screenWidth
            const clampedPosition = Math.max(0, Math.min(newPosition, screenWidth));

            // Update position for clipping
            if (Math.abs(clampedPosition - currentPosition) > 1) {
              setCurrentPosition(clampedPosition);
            }
          }
        }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // Final position
        const newPosition = currentPosition + gestureState.dx;
        const clampedPosition = Math.max(0, Math.min(newPosition, screenWidth));

        // Smooth animation to final position
        Animated.spring(pan, {
          toValue: clampedPosition,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }).start();

        setCurrentPosition(clampedPosition);

        // Haptic feedback on release
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  // Animated width for the mask
  const animatedWidth = pan.interpolate({
    inputRange: [0, screenWidth],
    outputRange: [0, screenWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height, width: screenWidth }]}>
      {/* After Image (full width) - Bottom layer */}
      <Image
        source={{ uri: afterImage }}
        style={[styles.image, { width: screenWidth, height }]}
        resizeMode="cover"
      />

      {/* Before Image (clipped) - Top layer with animated width */}
      <Animated.View
        style={[
          styles.beforeContainer,
          {
            width: animatedWidth,
            height,
          },
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
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sliderContainer,
          {
            height,
            transform: [
              {
                translateX: pan.interpolate({
                  inputRange: [0, screenWidth],
                  outputRange: [0, screenWidth],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
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
    left: -20, // Offset to center the handle
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