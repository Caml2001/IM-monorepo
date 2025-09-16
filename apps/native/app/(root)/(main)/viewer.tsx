import { useLocalSearchParams } from "expo-router";
import { Alert, Image, Platform, Share, View, Pressable, ScrollView, Switch } from "react-native";
import { useTheme } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Host, Text } from '@expo/ui/swift-ui';
import { glassEffect, padding } from '@expo/ui/swift-ui/modifiers';
import { BeforeAfterSliderOptimized } from "@/components/before-after-slider-optimized";
import { AppText } from "@/components/app-text";
import { useState } from "react";
import * as Haptics from "expo-haptics";

let SymbolView: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SymbolView = require("expo-symbols").SymbolView;
} catch {}
let FileSystem: any, MediaLibrary: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FileSystem = require("expo-file-system");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MediaLibrary = require("expo-media-library");
} catch {}

export const options: any = ({ route }: any) => ({
  headerShown: true,
  headerTransparent: true,
  title: "",
  headerBackTitleVisible: false,
  headerRight: () => null, // We'll handle buttons in the component
});

export default function ViewerScreen() {
  const { uri, originalUri, mode } = useLocalSearchParams<{
    uri?: string;
    originalUri?: string;
    mode?: string;
  }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showComparison, setShowComparison] = useState(mode === "compare");

  const src = uri ? decodeURIComponent(String(uri)) : undefined;
  const originalSrc = originalUri ? decodeURIComponent(String(originalUri)) : undefined;
  const isCompareMode = mode === "compare" && originalSrc && src;

  const handleToggleComparison = () => {
    console.log("Toggling comparison, current state:", showComparison);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComparison(!showComparison);
  };

  const onShare = async () => {
    const imageToShare = src;
    if (!imageToShare) return;
    try {
      await Share.share({ url: imageToShare, message: imageToShare });
    } catch {}
  };

  const onDownload = async () => {
    const imageToSave = src;
    if (!imageToSave) return;
    try {
      if (!FileSystem || !MediaLibrary) {
        await onShare();
        return;
      }
      // ensure permission for Media Library
      const perm = await MediaLibrary.requestPermissionsAsync?.();
      if (perm && perm.status !== "granted") {
        Alert.alert("Permission required", "Enable Photos access to save the image.");
        return;
      }
      let localUri = imageToSave;
      if (imageToSave.startsWith("http")) {
        const name = `dl_${Date.now()}.jpg`;
        const tmp = FileSystem.cacheDirectory + name;
        const res = await FileSystem.downloadAsync(imageToSave, tmp);
        localUri = res.uri;
      }
      // copy to a temp file if it's a bundled asset without scheme
      if (!localUri.startsWith("file:")) {
        // try to prefix
        localUri = imageToSave;
      }
      await MediaLibrary.saveToLibraryAsync(localUri);
      if (Platform.OS === "ios") Alert.alert("Saved", "Image saved to Photos");
    } catch (e) {
      // fallback to share
      await onShare();
    }
  };

  if (!src) return null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center px-4 py-4" style={{ paddingTop: insets.top + 60, paddingBottom: isCompareMode ? 80 : 20 }}>
          {/* Show comparison slider when in compare mode and switch is on */}
          {isCompareMode && showComparison ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              {/* Before/After Slider */}
              <BeforeAfterSliderOptimized
                beforeImage={originalSrc}
                afterImage={src}
                height={500}
              />

              {/* Info text */}
              <View className="mt-4 px-4">
                <AppText className="text-center text-muted-foreground text-sm">
                  Drag the slider to compare before and after
                </AppText>
              </View>
            </View>
          ) : (
            /* Regular single image view */
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Image
                source={{ uri: src }}
                resizeMode="contain"
                style={{
                  width: "100%",
                  height: 500,
                  borderRadius: 16,
                  backgroundColor: colors.panel
                }}
              />
              {isCompareMode && (
                <View className="mt-4 px-4">
                  <AppText className="text-center text-muted-foreground text-sm">
                    Showing restored image only
                  </AppText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comparison Toggle - Fixed at bottom when in compare mode */}
      {isCompareMode && (
        <View
          className="absolute left-4 right-4"
          style={{
            bottom: 24  // Simple bottom positioning
          }}
        >
          <Pressable
            onPress={handleToggleComparison}
            className="flex-row items-center justify-between px-4 py-3 bg-secondary rounded-xl"
          >
            <View className="flex-row items-center gap-3">
              <Icon
                name={showComparison ? "layers" : "image"}
                size={20}
                color={colors.foreground}
              />
              <AppText className="text-foreground font-medium">
                {showComparison ? "Comparison View" : "Single View"}
              </AppText>
            </View>

            <Switch
              value={showComparison}
              onValueChange={handleToggleComparison}
              trackColor={{
                false: colors.muted || '#767577',
                true: colors.primary || '#007AFF'
              }}
              thumbColor={colors.background || '#FFFFFF'}
              ios_backgroundColor={colors.muted || '#767577'}
            />
          </Pressable>
        </View>
      )}

      {/* Toggle button for compare mode (alternative button) */}
      {isCompareMode && (
        <Pressable
          onPress={handleToggleComparison}
          className="absolute"
          style={{
            top: insets.top + 12,
            left: 16,
          }}
        >
          <Host matchContents>
            <Text
              modifiers={[
                padding({
                  horizontal: 12,
                  vertical: 6,
                }),
                glassEffect({
                  glass: {
                    variant: 'regular',
                  },
                }),
              ]}>
              {showComparison ? "Single View" : "Compare"}
            </Text>
          </Host>
        </Pressable>
      )}

      {/* Share button - top right with SwiftUI glass effect */}
      <Pressable
        onPress={onShare}
        className="absolute"
        style={{
          top: insets.top + 12,
          right: 16,
        }}
      >
        <Host matchContents>
          <Text
            modifiers={[
              padding({
                horizontal: 12,
                vertical: 6,
              }),
              glassEffect({
                glass: {
                  variant: 'regular',
                },
              }),
            ]}>
            Share
          </Text>
        </Host>
      </Pressable>

      {/* Save button - bottom right with SwiftUI glass effect */}
      <Pressable
        onPress={onDownload}
        className="absolute"
        style={{
          bottom: insets.bottom + 40,
          right: 20,
        }}
      >
        <Host matchContents>
          <Text
            modifiers={[
              padding({
                horizontal: 20,
                vertical: 12,
              }),
              glassEffect({
                glass: {
                  variant: 'regular',
                },
              }),
            ]}>
            Save
          </Text>
        </Host>
      </Pressable>
    </View>
  );
}