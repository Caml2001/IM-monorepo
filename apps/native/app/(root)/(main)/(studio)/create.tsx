import { useState } from "react";
import { View, TextInput, ScrollView, Pressable, Image } from "react-native";
import { Button, Switch, useTheme } from "heroui-native";
import type { ImageSourcePropType } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { Icon } from "@/components/Icon";
import { PrimaryFooter } from "@/components/primary-footer";
import { PreviewCard } from "@/components/preview-card";
import { AppText } from "@/components/app-text";
import { ChipOption, Label, Section, Hint } from "@/components/ui";
import { Link } from "expo-router";
import { useRouter } from "expo-router";

const STYLES = ["Photoreal", "Anime", "Illustration", "Product"] as const;
const ASPECTS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

export default function CreateScreen() {
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Photoreal");
  const [guidance, setGuidance] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false); // collapsible panel
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("1:1");
  const [negative, setNegative] = useState("");
  const [seedLocked, setSeedLocked] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000_000));
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUris, setResultUris] = useState<ImageSourcePropType[]>([]);
  const router = useRouter();

  const sourceToUri = (src: ImageSourcePropType): string | undefined => {
    if (typeof src === "number") {
      // @ts-ignore resolve bundled asset
      return Image.resolveAssetSource(src)?.uri as string | undefined;
    }
    if (typeof src === "object" && src && "uri" in src) {
      // @ts-ignore RN ImageSource
      return (src as any).uri as string | undefined;
    }
    return undefined;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simula 4 resultados
    setTimeout(() => {
      setResultUris([
        require("@/assets/icon.png"),
        require("@/assets/adaptive-icon.png"),
        require("@/assets/splash.png"),
        require("@/assets/favicon.png"),
      ]);
      const first = sourceToUri(require("@/assets/icon.png"));
      if (first) router.push({ pathname: "/(root)/(main)/viewer", params: { uri: encodeURIComponent(first) } });
      setIsGenerating(false);
    }, 900);
  };

  // Keep guidance consistent with style
  const applyStyle = (s: (typeof STYLES)[number]) => {
    setStyle(s);
    const defaults: Record<(typeof STYLES)[number], number> = {
      Photoreal: 5,
      Anime: 9,
      Illustration: 8,
      Product: 6,
    };
    setGuidance(defaults[s]);
  };

  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-28" keyboardShouldPersistTaps="handled">
      <Section>
        <View className="gap-3">
          <Label>Prompt</Label>
          <TextInput
            placeholder="A cozy cabin in the woods at dusk…"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            className="rounded-xl border border-border p-3 text-base"
            placeholderTextColor={colors.mutedForeground}
            style={{ color: colors.foreground, textAlignVertical: "top" }}
          />
          <Hint>Tip: describe subject, setting, lighting and mood.</Hint>
        </View>
      </Section>

      <Section>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Label>Style</Label>
            <Link href="/(root)/(main)/(studio)/styles" asChild>
              <Pressable hitSlop={8} className="px-2 py-1 rounded-full">
                <AppText className="text-sm" style={{ color: colors.accent }}>More</AppText>
              </Pressable>
            </Link>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STYLES.map((s) => (
              <ChipOption key={s} label={s} selected={style === s} onPress={() => applyStyle(s)} />
            ))}
          </ScrollView>
          <Hint>Styles come with tuned defaults. Use Fine‑tune to override.</Hint>
        </View>
      </Section>

      {/* Advanced panel: value adds */}
      <Section>
        <View className="gap-2">
          <Pressable className="flex-row items-center justify-between" onPress={() => setShowAdvanced((v) => !v)}>
            <Label>Advanced</Label>
            <Icon name={showAdvanced ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {showAdvanced && (
            <View className="gap-4 pt-2">
              <View className="gap-2">
                <Label>Aspect Ratio</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {ASPECTS.map((a) => (
                    <ChipOption key={a} label={a} selected={aspect === a} onPress={() => setAspect(a)} />
                  ))}
                </ScrollView>
              </View>

              <View className="gap-2">
                <Label>Negative prompt</Label>
                <TextInput
                  placeholder="Low quality, blurry, extra hands…"
                  value={negative}
                  onChangeText={setNegative}
                  className="rounded-xl border border-border p-3 text-base"
                  placeholderTextColor={colors.mutedForeground}
                  style={{ color: colors.foreground, textAlignVertical: "top" }}
                />
                <Hint>Things to avoid in the result.</Hint>
              </View>

              

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Label>Lock seed</Label>
                  <Switch
                    isSelected={seedLocked}
                    onSelectedChange={(v) => {
                      const next = !!v;
                      setSeedLocked(next);
                      if (!next) setSeed(Math.floor(Math.random() * 10_000_000));
                    }}
                  />
                </View>
                {seedLocked ? (
                  <View className="flex-row items-center gap-3">
                    <AppText className="text-base" style={{ color: colors.mutedForeground }}>Seed: {seed}</AppText>
                    <Pressable hitSlop={8} onPress={() => setSeed(Math.floor(Math.random() * 10_000_000))}>
                      <Icon name="refresh-outline" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : (
                  <Hint>A new random seed will be used each time.</Hint>
                )}
              </View>
            </View>
          )}
        </View>
      </Section>

        {resultUris.length > 0 && (
          <Section>
            <View className="gap-2">
              <Label>Results</Label>
              <View className="flex-row flex-wrap gap-3">
                {resultUris.map((src, i) => (
                  <Pressable key={i} onPress={() => {
                    const uri = sourceToUri(src);
                    if (uri) router.push({ pathname: "/(root)/(main)/viewer", params: { uri: encodeURIComponent(uri) } });
                  }}>
                    <PreviewCard source={src} />
                  </Pressable>
                ))}
              </View>
            </View>
          </Section>
        )}
      </ScreenScrollView>
      <PrimaryFooter
        label={isGenerating ? "Generating" : "Generate"}
        loading={isGenerating}
        disabled={!prompt}
        onPress={handleGenerate}
      />

    </View>
  );
}
