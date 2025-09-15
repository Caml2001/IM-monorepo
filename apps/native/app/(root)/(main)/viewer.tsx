import { useLocalSearchParams } from "expo-router";
import { Alert, Image, Platform, Share, View, Pressable } from "react-native";
import { useTheme } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Host, Text } from '@expo/ui/swift-ui';
import { glassEffect, padding } from '@expo/ui/swift-ui/modifiers';
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
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const src = uri ? decodeURIComponent(String(uri)) : undefined;
  
  const onShare = async () => {
    if (!src) return;
    try {
      await Share.share({ url: src, message: src });
    } catch {}
  };
  
  const onDownload = async () => {
    if (!src) return;
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
      let localUri = src;
      if (src.startsWith("http")) {
        const name = `dl_${Date.now()}.jpg`;
        const tmp = FileSystem.cacheDirectory + name;
        const res = await FileSystem.downloadAsync(src, tmp);
        localUri = res.uri;
      }
      // copy to a temp file if it's a bundled asset without scheme
      if (!localUri.startsWith("file:")) {
        // try to prefix
        localUri = src;
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
      <View className="flex-1 items-center justify-center px-4 py-4">
        <Image source={{ uri: src }} resizeMode="contain" style={{ width: "100%", height: "90%", borderRadius: 16, backgroundColor: colors.panel }} />
      </View>
      
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
