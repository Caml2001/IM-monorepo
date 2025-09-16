import { useState, useRef } from "react";
import { View, TextInput, ScrollView, Pressable, Image, Alert, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Button, Switch, useTheme } from "heroui-native";
import type { ImageSourcePropType } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { Icon } from "@/components/Icon";
import { PrimaryFooter } from "@/components/primary-footer";
import { PreviewCard } from "@/components/preview-card";
import { AppText } from "@/components/app-text";
import { ChipOption, Label, Section, Hint } from "@/components/ui";
import { useRouter } from "expo-router";
import { useGenerateImage, useEnhancePrompt } from "@/lib/hooks/useImages";
import { useCurrentUser, useUserCredits } from "@/lib/hooks/useUser";
import { useAppTheme } from "@/contexts/app-theme-context";

const STYLES = ["Photoreal", "Anime", "Illustration", "Product", "Cinematic", "Fantasy", "Minimal"] as const;

// Style modifiers to enhance the prompt
const STYLE_MODIFIERS: Record<string, string> = {
  Photoreal: "photorealistic, ultra detailed, professional photography, 8k resolution, high quality",
  Anime: "anime style, manga art, japanese animation, studio ghibli style, vibrant colors",
  Illustration: "digital illustration, artistic drawing, detailed artwork, creative design",
  Product: "product photography, commercial shot, clean background, professional lighting, marketing photo",
  Cinematic: "cinematic shot, movie still, dramatic lighting, film photography, wide angle, epic composition",
  Fantasy: "fantasy art, magical, ethereal, dreamlike, surreal, mystical atmosphere",
  Minimal: "minimalist design, simple, clean lines, modern, elegant, white background",
};
const ASPECTS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

export default function CreateScreen() {
  const { colors } = useTheme();
  const { currentTheme } = useAppTheme();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Photoreal");
  const [guidance, setGuidance] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false); // collapsible panel
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("1:1");
  const [negative, setNegative] = useState("");
  const [seedLocked, setSeedLocked] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000_000));
  const [resultUris, setResultUris] = useState<string[]>([]);
  const router = useRouter();
  
  // Hooks for backend
  const { user, isLoading: userLoading } = useCurrentUser();
  const credits = useUserCredits(user?._id);
  const { generate, isGenerating } = useGenerateImage();
  const { enhancePrompt, isEnhancing } = useEnhancePrompt();
  
  // Debug logging
  console.log("User:", user);
  console.log("Credits:", credits);
  console.log("User loading:", userLoading);

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
    console.log("=== handleGenerate called ===");
    console.log("User:", user);
    console.log("User ID:", user?._id);
    console.log("Credits:", credits);
    console.log("Prompt:", prompt);
    
    // Check if user is authenticated
    if (!user?._id) {
      console.log("No user ID, showing auth alert");
      Alert.alert("Authentication Required", "Please sign in to generate images");
      return;
    }
    
    // For testing, skip credit check temporarily
    // if (credits <= 0) {
    //   Alert.alert("No Credits", "You don't have enough credits to generate images");
    //   return;
    // }
    
    if (!prompt.trim()) {
      Alert.alert("Missing Prompt", "Please enter a description for your image");
      return;
    }
    
    try {
      console.log("Starting generation with prompt:", prompt);
      console.log("Calling generate function...");
      
      // Apply style modifier to the prompt
      const styleModifier = STYLE_MODIFIERS[style] || "";
      const enhancedPrompt = `${prompt}, ${styleModifier}`;
      
      console.log("Enhanced prompt with style:", enhancedPrompt);
      
      const result = await generate({
        userId: user._id,
        prompt: enhancedPrompt,
        negativePrompt: negative || undefined,
        quality: "fast", // Use fast for testing
        seed: seedLocked ? seed : undefined,
        aspectRatio: aspect,
      });
      
      console.log("Generation result:", result);
      
      if (result?.imageUrl) {
        console.log("Got image URL:", result.imageUrl);
        setResultUris([result.imageUrl]);
        // Navigate to viewer with the generated image
        router.push({ 
          pathname: "/(root)/(main)/viewer", 
          params: { uri: encodeURIComponent(result.imageUrl) } 
        });
      } else {
        console.log("No image URL in result");
      }
    } catch (error) {
      console.error("Generation error:", error);
      // Error is already handled by the hook with Alert
    }
  };

  // Apply style and adjust parameters
  const applyStyle = (s: (typeof STYLES)[number]) => {
    setStyle(s);
    
    // Adjust negative prompt based on style
    const negativeDefaults: Record<string, string> = {
      Photoreal: "blurry, low quality, distorted, unrealistic, cartoon",
      Anime: "realistic, photographic, western style, low quality",
      Illustration: "photorealistic, blurry, low quality",
      Product: "cluttered, messy, unprofessional, low quality, blurry",
      Cinematic: "amateur, low quality, blurry, bad composition",
      Fantasy: "realistic, mundane, ordinary, low quality",
      Minimal: "cluttered, complex, busy, detailed background",
    };
    
    if (negativeDefaults[s] && !negative) {
      setNegative(negativeDefaults[s]);
    }
  };

  return (
    <View className="flex-1">
      <ScreenScrollView
        disableHeaderOffset
        contentContainerClassName="gap-5 pb-28"
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
        placeholder="Describe your vision in detail: subject, setting, lighting, mood, style..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={4}
        className={`rounded-xl border-2 p-4 text-base font-medium bg-white dark:bg-zinc-900 text-gray-900 dark:text-white ${
          prompt ? 'border-blue-500' : 'border-gray-200 dark:border-zinc-800'
        }`}
        placeholderTextColor={colors.mutedForeground}
        style={{
          textAlignVertical: "top",
          minHeight: 100,
        }}
      />

      <Button
        variant={prompt ? "secondary" : undefined}
        size="md"
        className="rounded-xl"
        disabled={isEnhancing}
        onPress={async () => {
          if (!user?._id) {
            Alert.alert("Authentication Required", "Please sign in to enhance prompts");
            return;
          }

          try {
            // For text-to-image, we don't have images but can still enhance the prompt
            const result = await enhancePrompt([], prompt);
            if (result.enhancedPrompt) {
              setPrompt(result.enhancedPrompt);
            }
          } catch (error) {
            console.error("Enhancement error:", error);
          }
        }}
      >
        <Button.StartContent>
          <Icon name="sparkles" size={18} color={isEnhancing ? colors.mutedForeground : (prompt ? colors.foreground : colors.background)} />
        </Button.StartContent>
        <Button.LabelContent className="font-semibold">{isEnhancing ? "Enhancing with AI..." : "Enhance with AI"}</Button.LabelContent>
      </Button>

      <Section>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Label>Style</Label>
            <Pressable
              hitSlop={8}
              className="px-2 py-1 rounded-full"
              onPress={() => router.push("/(root)/(main)/(studio)/styles")}
            >
              <AppText className="text-sm" style={{ color: colors.accent }}>More</AppText>
            </Pressable>
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
                  className="rounded-xl border p-3 text-base bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-200 dark:border-zinc-800"
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    textAlignVertical: "top",
                  }}
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
                {resultUris.map((uri, i) => (
                  <Pressable key={i} onPress={() => {
                    router.push({ pathname: "/(root)/(main)/viewer", params: { uri: encodeURIComponent(uri) } });
                  }}>
                    <PreviewCard source={{ uri }} />
                  </Pressable>
                ))}
              </View>
            </View>
          </Section>
        )}
      </ScreenScrollView>
      <PrimaryFooter
        label={isGenerating ? "Generating..." : credits > 0 ? `Generate (${credits} credits)` : "No Credits"}
        loading={isGenerating}
        disabled={!prompt || credits <= 0 || !user}
        onPress={handleGenerate}
      />
    </View>
  );
}
