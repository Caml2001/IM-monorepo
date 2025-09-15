import { useLocalSearchParams } from "expo-router";
import { Alert, Image, Platform, Share, View, Pressable, Text } from "react-native";
import { useTheme } from "heroui-native";
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
  headerRight: () => {
    const uri = route?.params?.uri as string | undefined;
    const onShare = async () => {
      if (!uri) return;
      try {
        await Share.share({ url: uri, message: uri });
      } catch {}
    };
    const onDownload = async () => {
      if (!uri) return;
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
        let localUri = uri;
        if (uri.startsWith("http")) {
          const name = `dl_${Date.now()}.jpg`;
          const tmp = FileSystem.cacheDirectory + name;
          const res = await FileSystem.downloadAsync(uri, tmp);
          localUri = res.uri;
        }
        // copy to a temp file if it's a bundled asset without scheme
        if (!localUri.startsWith("file:")) {
          // try to prefix
          localUri = uri;
        }
        await MediaLibrary.saveToLibraryAsync(localUri);
        if (Platform.OS === "ios") Alert.alert("Saved", "Image saved to Photos");
      } catch (e) {
        // fallback to share
        await onShare();
      }
    };
    const Icon = ({ name }: { name: string }) =>
      SymbolView ? (
        <SymbolView name={name} tintColor="#fff" style={{ width: 20, height: 20 }} />
      ) : (
        <Text style={{ color: "#fff", fontWeight: "600" }}>{name === "square.and.arrow.up" ? "Share" : "Save"}</Text>
      );
    return (
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <Pressable onPress={onDownload} style={{ padding: 6 }} hitSlop={8}>
          <Icon name={Platform.OS === "ios" ? "arrow.down.circle" : "download"} />
        </Pressable>
        <Pressable onPress={onShare} style={{ padding: 6 }} hitSlop={8}>
          <Icon name={Platform.OS === "ios" ? "square.and.arrow.up" : "share"} />
        </Pressable>
      </View>
    );
  },
});

export default function ViewerScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { colors } = useTheme();
  const src = uri ? decodeURIComponent(String(uri)) : undefined;
  if (!src) return null;
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4 py-4">
        <Image source={{ uri: src }} resizeMode="contain" style={{ width: "100%", height: "90%", borderRadius: 16, backgroundColor: colors.panel }} />
      </View>
    </View>
  );
}
