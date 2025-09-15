import { View, Text } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";

export default function TrendsScreen() {
  return (
    <View className="flex-1">
      <ScreenScrollView contentContainerClassName="gap-4 pb-10">
        <Text className="text-2xl font-bold text-foreground">Trends</Text>
        <Text className="text-muted-foreground">
          Explore popular prompts and styles. (Coming soon)
        </Text>
      </ScreenScrollView>
    </View>
  );
}

