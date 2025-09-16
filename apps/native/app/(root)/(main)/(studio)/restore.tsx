import { useState } from "react";
import { View, Image, Pressable, Alert } from "react-native";
import { Button, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section, ChipOption, Hint } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { AppText } from "@/components/app-text";
import * as ImagePicker from "expo-image-picker";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useRestoreImage, useUploadImage } from "@/lib/hooks/useImages";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/contexts/app-theme-context";

const SAFETY_LEVELS = [
  { value: 0, label: "Strict", description: "Most conservative filtering" },
  { value: 1, label: "Balanced", description: "Moderate filtering" },
  { value: 2, label: "Permissive", description: "Minimal filtering" },
] as const;

export default function RestoreScreen() {
  const { colors } = useTheme();
  const { currentTheme } = useAppTheme();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { restore, isRestoring } = useRestoreImage();
  const { uploadImage, isUploading } = useUploadImage();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [safetyTolerance, setSafetyTolerance] = useState<0 | 1 | 2>(2);

  const handlePick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "We need access to your photos to continue.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });
      if (!res.canceled && res.assets?.[0]) {
        setImageUri(res.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      Alert.alert("Could not open image picker", String((e as Error).message ?? e));
    }
  };

  const handleRestore = async () => {
    if (!user?._id) {
      Alert.alert("Authentication Required", "Please sign in to restore images");
      return;
    }

    if (!imageUri) {
      Alert.alert("No Image", "Please select an image to restore");
      return;
    }

    try {
      // Upload image to R2 first
      const uploadedUrl = await uploadImage(user._id, imageUri);

      // Restore the image
      const result = await restore({
        userId: user._id,
        imageUrl: uploadedUrl,
        safetyTolerance,
      });

      if (result?.imageUrl) {
        // Navigate to viewer with the restored image
        router.push({
          pathname: "/(root)/(main)/viewer",
          params: { uri: encodeURIComponent(result.imageUrl) }
        });
      } else {
        Alert.alert("Error", "Failed to restore image - no result URL");
      }
    } catch (error) {
      console.error("Restore error:", error);
      // Error is already handled by the hooks
    }
  };

  const isProcessing = isUploading || isRestoring;

  return (
    <View className="flex-1">
      <ScreenScrollView
        disableHeaderOffset
        contentContainerClassName="gap-5 pb-28"
        keyboardShouldPersistTaps="handled"
      >
        {/* Empty state */}
        {!imageUri ? (
          <Section>
            <View className="items-center gap-3 py-6">
              <Icon name="image-outline" size={32} color={colors.mutedForeground} />
              <Label>No image selected</Label>
              <Hint>Upload a photo to restore and enhance</Hint>
              <Pressable
                className="px-4 py-3 bg-secondary rounded-xl flex-row items-center gap-2"
                onPress={handlePick}
              >
                <Icon name="cloud-upload-outline" size={20} color={colors.foreground} />
                <AppText className="font-semibold text-foreground">
                  Choose Image
                </AppText>
              </Pressable>
            </View>
          </Section>
        ) : (
          <>
            {/* Image preview */}
            <Section>
              <View className="gap-3">
                <Label>Image to Restore</Label>
                <View className="relative">
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: "100%",
                      height: 300,
                      borderRadius: 12,
                      backgroundColor: colors.muted,
                    }}
                    resizeMode="cover"
                  />
                  <Pressable
                    className="absolute top-2 right-2 bg-background/90 p-2 rounded-full"
                    onPress={() => {
                      setImageUri(null);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Icon name="close" size={20} color={colors.foreground} />
                  </Pressable>
                </View>
                <Hint>AI will automatically fix blur, scratches, and enhance colors</Hint>
              </View>
            </Section>

            {/* Advanced settings */}
            <Section>
              <View className="gap-2">
                <Pressable
                  className="flex-row items-center justify-between"
                  onPress={() => setShowAdvanced(!showAdvanced)}
                >
                  <Label>Advanced</Label>
                  <Icon
                    name={showAdvanced ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                {showAdvanced && (
                  <View className="gap-4 pt-2">
                    <View className="gap-3">
                      <Label>Safety Tolerance</Label>
                      <View className="gap-2">
                        {SAFETY_LEVELS.map((level) => (
                          <Pressable
                            key={level.value}
                            className={`p-3 rounded-xl border ${
                              safetyTolerance === level.value
                                ? "border-accent bg-accent/10"
                                : "border-border"
                            }`}
                            onPress={() => {
                              setSafetyTolerance(level.value as 0 | 1 | 2);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="gap-1">
                                <AppText
                                  className={`font-semibold ${
                                    safetyTolerance === level.value
                                      ? "text-accent"
                                      : "text-foreground"
                                  }`}
                                >
                                  {level.label}
                                </AppText>
                                <AppText className="text-sm text-muted-foreground">
                                  {level.description}
                                </AppText>
                              </View>
                              {safetyTolerance === level.value && (
                                <Icon name="checkmark-circle" size={20} color={colors.accent} />
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      <Hint>Controls how the AI handles potentially sensitive content</Hint>
                    </View>
                  </View>
                )}
              </View>
            </Section>

            {/* Replace image button */}
            <Button
              variant="tertiary"
              className="rounded-xl"
              onPress={handlePick}
            >
              <Button.StartContent>
                <Icon name="swap-horizontal" size={18} color={colors.foreground} />
              </Button.StartContent>
              <Button.LabelContent className="font-semibold">
                Replace Image
              </Button.LabelContent>
            </Button>
          </>
        )}
      </ScreenScrollView>

      {/* Footer with CTA */}
      {imageUri && (
        <PrimaryFooter
          label={isProcessing ? (isUploading ? "Uploading" : "Restoring") : "Restore Image"}
          disabled={isProcessing}
          loading={isProcessing}
          onPress={handleRestore}
        />
      )}
    </View>
  );
}