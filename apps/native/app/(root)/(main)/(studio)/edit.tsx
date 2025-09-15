import { useState } from "react";
import { View, Image, TextInput, Pressable, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Switch, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section, ChipOption, Hint } from "@/components/ui";
import { Icon } from "@/components/Icon";

const MODES = ["Create", "Background Remove"] as const;
const BG_PRESETS = ["Transparent", "White", "Black", "Blur"] as const;

export default function EditScreen() {
  const { colors } = useTheme();
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState<(typeof MODES)[number]>("Create");
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 800);
  };

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
                  const sampleUri = (Image as any).resolveAssetSource(require("@/assets/icon.png")).uri;
                  setImages((prev) => Array.from(new Set([...prev, sampleUri])).slice(0, 5));
                }}
              >
                <Button.LabelContent>Try sample</Button.LabelContent>
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
          <View className="gap-2">
            <Label>Create prompt</Label>
            <TextInput
              placeholder={"A cinematic poster in a neon city…"}
              value={prompt}
              onChangeText={setPrompt}
              className="rounded-xl border border-border p-3 text-base"
              placeholderTextColor={colors.mutedForeground}
              style={{ color: colors.foreground, textAlignVertical: "top" }}
            />
            <Hint>Describe the new scene that blends your photos (optional).</Hint>
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
        label={isProcessing ? "Processing" : images.length === 0 ? "Upload photos" : "Apply"}
        loading={isProcessing}
        onPress={images.length === 0 ? handlePick : handleProcess}
        disabled={images.length === 0}
      />
    </View>
  );
}
