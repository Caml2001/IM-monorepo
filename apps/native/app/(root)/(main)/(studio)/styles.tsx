import { View, Text, ScrollView } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ChipOption, Label, Section, Hint } from "@/components/ui";
import { useState } from "react";

const MORE_STYLES = [
  "Photoreal",
  "Cinematic",
  "Portrait",
  "Analog Film",
  "Neon",
  "Cyberpunk",
  "Watercolor",
  "Oil Painting",
  "3D Render",
  "Anime",
  "Manga",
  "Product Studio",
  "Isometric",
] as const;

export default function StylesGalleryScreen() {
  const [selected, setSelected] = useState<string>("Photoreal");
  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-10 pt-2">
        <Section>
          <View className="gap-2">
            <Label>Browse styles</Label>
            <Hint>Tap a style to preview ideas (selection not wired yet).</Hint>
            <View className="flex-row flex-wrap gap-2">
              {MORE_STYLES.map((s) => (
                <ChipOption key={s} label={s} selected={selected === s} onPress={() => setSelected(s)} />
              ))}
            </View>
          </View>
        </Section>

        <Section>
          <View className="gap-2">
            <Label>What this could include</Label>
            <Text className="text-muted-foreground">
              Style thumbnails and curated prompts could appear here. Selecting one would
              apply back on Create.
            </Text>
          </View>
        </Section>
      </ScreenScrollView>
    </View>
  );
}

