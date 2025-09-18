import { useLocalSearchParams, useNavigation } from "expo-router";
import { Alert, Image, Platform, Share, View, Pressable, ScrollView, Switch } from "react-native";
import { useTheme } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { BeforeAfterSliderOptimized } from "@/components/before-after-slider-optimized";
import { AppText } from "@/components/app-text";
import { useCallback, useLayoutEffect, useState } from "react";
import * as Haptics from "expo-haptics";

let SymbolView: any;
let GlassView: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SymbolView = require("expo-symbols").SymbolView;
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  GlassView = require('expo-glass-effect').GlassView;
} catch {}
let FileSystem: any, MediaLibrary: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FileSystem = require("expo-file-system/legacy");
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
  const navigation = useNavigation();
  const [showComparison, setShowComparison] = useState(mode === "compare");

  const src = uri ? decodeURIComponent(String(uri)) : undefined;
  const originalSrc = originalUri ? decodeURIComponent(String(originalUri)) : undefined;
  const isCompareMode = mode === "compare" && originalSrc && src;

  const handleToggleComparison = () => {
    console.log("Toggling comparison, current state:", showComparison);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComparison(!showComparison);
  };

  const onShare = useCallback(async () => {
    const imageToShare = src;
    if (!imageToShare) return;
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ url: imageToShare });
      } else {
        await Share.share({ message: imageToShare, url: imageToShare });
      }
    } catch {}
  }, [src]);

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
        const name = `imagenary_${Date.now()}.jpg`;
        const tmp = (FileSystem.cacheDirectory || "") + name;
        const res = await FileSystem.downloadAsync(imageToSave, tmp);
        localUri = res.uri;
      }
      // If still not a local file path, fallback to Share
      if (!localUri.startsWith("file:")) {
        await onShare();
        return;
      }
      await MediaLibrary.saveToLibraryAsync(localUri);
      if (Platform.OS === "ios") Alert.alert("Saved", "Image saved to Photos");
    } catch (e) {
      // fallback to share
      await onShare();
    }
  };

  // Reusable glass button using native GlassView when available
  const GlassButton = ({ onPress, label, icon, style }: { onPress: () => void; label: string; icon?: string; style?: any }) => (
    <Pressable onPress={onPress} hitSlop={8} style={[{ borderRadius: 16, overflow: 'hidden' }, style]}>
      {GlassView ? (
        <GlassView glass={{ variant: 'regular' }} style={{ borderRadius: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
            {SymbolView && icon ? (
              <SymbolView name={icon} style={{ width: 18, height: 18, marginRight: 6 }} />
            ) : null}
            <AppText className="text-foreground font-medium">{label}</AppText>
          </View>
        </GlassView>
      ) : (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}>
          <AppText className="text-white font-medium">{label}</AppText>
        </View>
      )}
    </Pressable>
  );

  // Align a native glass button in the header (top-right)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <GlassButton onPress={onShare} label="Share" icon="square.and.arrow.up" />
      ),
    });
  }, [navigation, onShare]);

  if (!src) return null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center px-2 py-2" style={{ paddingTop: insets.top + 50, paddingBottom: isCompareMode ? 70 : 10 }}>
          {/* Show comparison slider when in compare mode and switch is on */}
          {isCompareMode && showComparison ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              {/* Before/After Slider */}
              <BeforeAfterSliderOptimized
                beforeImage={originalSrc}
                afterImage={src}
                height={600}
              />

              {/* Info text */}
              <View className="mt-4 px-4">
                <AppText className="text-center text-muted-foreground text-sm">
                  Drag the slider to compare before and after
                </AppText>
              </View>
            </View>
          ) : (
            /* Regular single image view - full space */
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={{ uri: src }}
                resizeMode="contain"
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: 700
                }}
              />
              {isCompareMode && (
                <View className="absolute bottom-0 px-4 py-2">
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
        <GlassButton
          onPress={handleToggleComparison}
          label={showComparison ? "Single View" : "Compare"}
          icon={showComparison ? undefined : undefined}
          style={{ position: 'absolute', top: insets.top + 56, left: 16, zIndex: 10 }}
        />
      )}

      {/* Share button now lives in headerRight via navigation options */}

      {/* Save button - bottom right with glass effect */}
      <GlassButton
        onPress={onDownload}
        label="Save"
        icon="square.and.arrow.down"
        style={{ position: 'absolute', bottom: insets.bottom + 40, right: 20, zIndex: 10 }}
      />
    </View>
  );
}
