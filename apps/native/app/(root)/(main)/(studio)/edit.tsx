import { useState } from "react";
import { View, Image, TextInput, Pressable, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Switch, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section, ChipOption, Hint } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { AppText } from "@/components/app-text";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useMixImages, useRemoveBackground, useUploadImage, useEnhancePrompt } from "@/lib/hooks/useImages";
import { useRouter } from "expo-router";

const MODES = ["Create", "Background Remove"] as const;
const BG_PRESETS = ["Transparent", "White", "Black", "Blur"] as const;

export default function EditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { mixImages, isProcessing: isMixing } = useMixImages();
  const { removeBackground, isProcessing: isRemoving } = useRemoveBackground();
  const { uploadImage, isUploading } = useUploadImage();
  const { enhancePrompt, isEnhancing } = useEnhancePrompt();
  
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState<(typeof MODES)[number]>("Create");
  const [prompt, setPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Create advanced
  const [negative, setNegative] = useState("");
  const [seedLocked, setSeedLocked] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000_000));
  // Background Remove settings
  const [bgPreset, setBgPreset] = useState<(typeof BG_PRESETS)[number]>("Transparent");
  // No extra advanced settings for Create in this MVP

  const handlePick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "We need access to your photos to continue.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 1,
      } as any);
      if (!res.canceled) {
        const picked = (res.assets || []).map((a) => a.uri).filter(Boolean) as string[];
        setImages((prev) => {
          const merged = [...prev, ...picked];
          // de-dup and cap at 5
          const unique = Array.from(new Set(merged)).slice(0, 5);
          return unique;
        });
      }
    } catch (e) {
      Alert.alert("Could not open image picker", String((e as Error).message ?? e));
    }
  };

  const handleProcess = async () => {
    if (!user?._id) {
      Alert.alert("Authentication Required", "Please sign in to process images");
      return;
    }
    
    if (images.length === 0) {
      Alert.alert("No Images", "Please select at least one image");
      return;
    }
    
    try {
      let result;
      
      // Upload local images to R2 first
      console.log("Uploading images to R2...");
      const uploadedUrls = await Promise.all(
        images.map(async (imageUri) => {
          try {
            const uploadedUrl = await uploadImage(user._id, imageUri);
            console.log(`Uploaded: ${imageUri} -> ${uploadedUrl}`);
            return uploadedUrl;
          } catch (error) {
            console.error(`Failed to upload ${imageUri}:`, error);
            throw error;
          }
        })
      );
      
      console.log("All images uploaded:", uploadedUrls);
      
      if (mode === "Create") {
        // Mix/blend images with nano-banana
        console.log("Mixing images with prompt:", prompt || "Blend these images naturally");
        result = await mixImages({
          userId: user._id,
          imageUrls: uploadedUrls,
          prompt: prompt || undefined,
          negativePrompt: negative || undefined,
          seed: seedLocked ? seed : undefined,
        });
      } else {
        // Remove background from first image
        console.log("Removing background from image");
        result = await removeBackground({
          userId: user._id,
          imageUrl: uploadedUrls[0],
          preservePartialAlpha: true,
        });
      }
      
      console.log("Process result:", result);
      
      if (result?.imageUrl) {
        // Navigate to viewer with the processed image
        router.push({ 
          pathname: "/(root)/(main)/viewer", 
          params: { uri: encodeURIComponent(result.imageUrl) } 
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      // Error is already handled by the hooks
    }
  };
  
  const isProcessing = isUploading || isMixing || isRemoving || isEnhancing;

  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-28" keyboardShouldPersistTaps="handled">

      {/* Empty state first */}
      {images.length === 0 ? (
        <Section>
          <View className="items-center gap-3 py-6">
            <Icon name="image-outline" size={32} color={colors.mutedForeground} />
            <Label>No image yet</Label>
            <Hint>Upload one or more photos to edit or create.</Hint>
            <View className="flex-row gap-3 pt-2">
              <Button className="rounded-full" onPress={handlePick}>
                <Button.LabelContent>Upload photo</Button.LabelContent>
              </Button>
              <Button
                variant="tertiary"
                className="rounded-full"
                onPress={() => {
                  // Use public sample images for testing
                  const sampleImages = [
                    "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=500&q=80",
                    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&q=80"
                  ];
                  setImages((prev) => {
                    const merged = [...prev, ...sampleImages];
                    return Array.from(new Set(merged)).slice(0, 5);
                  });
                }}
              >
                <Button.LabelContent>Try samples</Button.LabelContent>
              </Button>
            </View>
          </View>
        </Section>
      ) : (
        <>
          <Section>
            <View className="gap-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {images.map((uri, idx) => (
                  <View key={uri} className="items-center">
                    <View style={{ position: "relative" }}>
                      <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                      <Pressable
                        onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          borderRadius: 9999,
                          padding: 6,
                          shadowColor: "#000",
                          shadowOpacity: 0.25,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 4,
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="close" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View className="flex-row gap-3 justify-end">
                <Button variant="tertiary" className="rounded-full" onPress={handlePick}>
                  <Button.LabelContent>Add more</Button.LabelContent>
                </Button>
                <Button variant="tertiary" className="rounded-full" onPress={() => setImages([])}>
                  <Button.LabelContent>Clear</Button.LabelContent>
                </Button>
              </View>
            </View>
          </Section>

          <View className="gap-2">
            <Label>Mode</Label>
              {(() => {
                const available = images.length > 1 ? (["Create"] as const) : MODES;
                return (
                  <View className="flex-row gap-3">
                    {available.map((m) => {
                      const isSolo = available.length === 1;
                      const ratio = m === "Create" ? 0.40 : 0.6;
                      return (
                      <View key={m} style={{ flex: isSolo ? 1 : ratio }}>
                        <Button
                          className="rounded-full justify-start w-full"
                          size="lg"
                          variant={mode === m ? undefined : "secondary"}
                          onPress={() => setMode(m)}
                        >
                         <Button.StartContent>
                           {m === "Create" ? (
                             <Icon
                               name="color-wand-outline"
                               size={18}
                               color={mode === m ? colors.background : colors.foreground}
                             />
                           ) : (
                             <Icon
                               name="image-outline"
                               size={18}
                               color={mode === m ? colors.background : colors.foreground}
                             />
                           )}
                         </Button.StartContent>
                         <Button.LabelContent className="font-bold text-left">{m}</Button.LabelContent>
                        </Button>
                      </View>
                    )})}
                  </View>
                );
              })()}
            <Hint>
              {mode === "Create"
                ? "Select photos and describe the new context."
                : "Remove background or replace with a preset."}
            </Hint>
          </View>

      {images.length > 0 && mode !== "Background Remove" && (
        <Section>
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Icon name="color-wand-outline" size={20} color={colors.accent} />
              <Label>Creative Prompt</Label>
            </View>
            <TextInput
              placeholder={"Describe your vision: style, mood, setting, lighting..."}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              className="rounded-xl border-2 p-4 text-base font-medium"
              placeholderTextColor={colors.mutedForeground}
              style={{ 
                color: colors.foreground, 
                textAlignVertical: "top", 
                minHeight: 100,
                borderColor: prompt ? colors.accent : colors.border,
                backgroundColor: prompt ? colors.accent + '05' : 'transparent'
              }}
            />
            <Button
              variant={prompt ? "secondary" : undefined}
              size="md"
              className="rounded-xl self-stretch"
              disabled={isEnhancing || images.length === 0}
              onPress={async () => {
                  if (!user?._id) {
                    Alert.alert("Authentication Required", "Please sign in to enhance prompts");
                    return;
                  }
                  
                  try {
                    // Upload images first if they're local
                    const uploadedUrls = await Promise.all(
                      images.map(async (imageUri) => {
                        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
                          return imageUri;
                        }
                        return await uploadImage(user._id, imageUri);
                      })
                    );
                    
                    // Enhance the prompt
                    const result = await enhancePrompt(uploadedUrls, prompt);
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
                <Button.LabelContent className="font-semibold">{isEnhancing ? "Enhancing with AI..." : "✨ Enhance with AI"}</Button.LabelContent>
              </Button>
            {prompt && (
              <View className="p-3 rounded-lg" style={{ backgroundColor: colors.accent + '10', borderWidth: 1, borderColor: colors.accent + '30' }}>
                <AppText className="text-xs" style={{ color: colors.foreground }}>💡 Tip: A detailed prompt creates much better results!</AppText>
              </View>
            )}
          </View>
        </Section>
      )}

      {/* Advanced panel */}
      <Section>
        <View className="gap-2">
          <Pressable className="flex-row items-center justify-between" onPress={() => setShowAdvanced((v) => !v)}>
            <Label>Advanced</Label>
          </Pressable>
          {showAdvanced && (
            <View className="gap-4 pt-2">
              {mode === "Background Remove" && (
                <View className="gap-2">
                  <Label>Background</Label>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {BG_PRESETS.map((b) => (
                      <ChipOption key={b} label={b} selected={bgPreset === b} onPress={() => setBgPreset(b)} />
                    ))}
                  </ScrollView>
                  <Hint>Transparent exports PNG.</Hint>
                </View>
              )}

              {mode === "Create" && (
                <>
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
                        <Label>Seed: {seed}</Label>
                        <Pressable hitSlop={8} onPress={() => setSeed(Math.floor(Math.random() * 10_000_000))}>
                          <Icon name="refresh-outline" size={16} color={colors.mutedForeground} />
                        </Pressable>
                      </View>
                    ) : (
                      <Hint>A new random seed will be used each time.</Hint>
                    )}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </Section>
        </>
      )}
      </ScreenScrollView>
      <PrimaryFooter
        label={isUploading ? "Uploading..." : isProcessing ? "Processing..." : images.length === 0 ? "Upload photos" : mode === "Create" ? "Mix Images" : "Remove Background"}
        loading={isProcessing}
        onPress={images.length === 0 ? handlePick : handleProcess}
        disabled={images.length === 0 || !user}
      />
    </View>
  );
}
