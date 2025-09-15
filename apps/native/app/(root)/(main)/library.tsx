import { View, Text } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";

export default function LibraryScreen() {
  return (
    <View className="flex-1">
      <ScreenScrollView contentContainerClassName="gap-4 pb-10">
        <Text className="text-2xl font-bold text-foreground">Library</Text>
        <Text className="text-muted-foreground">
          Your generated and edited images will appear here.
        </Text>
      </ScreenScrollView>
    </View>
  );
}

