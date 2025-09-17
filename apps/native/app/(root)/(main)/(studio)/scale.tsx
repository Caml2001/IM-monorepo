import { useState, useEffect } from "react";
import { View, Image, Alert, ActivityIndicator } from "react-native";
import { Button, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section, Hint } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { AppText } from "@/components/app-text";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useUpscaleImage, useUploadImage } from "@/lib/hooks/useImages";

export default function ScaleScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { upscale, isUpscaling } = useUpscaleImage();
  const { uploadImage, isUploading } = useUploadImage();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get image dimensions when image is selected
  useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        setImageDimensions({ width, height });
      }, (error) => {
        console.error("Error getting image dimensions:", error);
      });
    }
  }, [imageUri]);

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Resize image if it's too large for the model
  const resizeImageIfNeeded = async (uri: string): Promise<string> => {
    const MAX_PIXELS = 2000000; // ~2 megapixels limit for Real-ESRGAN

    if (!imageDimensions) return uri;

    const totalPixels = imageDimensions.width * imageDimensions.height;

    if (totalPixels <= MAX_PIXELS) {
      return uri; // Image is small enough
    }

    // Calculate new dimensions maintaining aspect ratio
    const scaleFactor = Math.sqrt(MAX_PIXELS / totalPixels);
    const newWidth = Math.floor(imageDimensions.width * scaleFactor);
    const newHeight = Math.floor(imageDimensions.height * scaleFactor);

    console.log(`Resizing image from ${imageDimensions.width}x${imageDimensions.height} to ${newWidth}x${newHeight}`);

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  };

  const handleUpscale = async () => {
    if (!user?._id) {
      Alert.alert("Authentication Required", "Please sign in to upscale images");
      return;
    }

    if (!imageUri) return;

    setIsProcessing(true);

    try {
      // Resize if needed
      const processedUri = await resizeImageIfNeeded(imageUri);

      // Upload image
      const uploadedUrl = await uploadImage(user._id, processedUri);

      // Upscale the image (GPT-Image model handles scale automatically)
      const result = await upscale({
        userId: user._id,
        imageUrl: uploadedUrl,
        scale: 2, // Default value, not used by GPT-Image
        faceEnhance: false, // Default value, not used by GPT-Image
        width: imageDimensions?.width,
        height: imageDimensions?.height,
      });

      if (result?.imageUrl) {
        // Navigate to viewer with both original and upscaled images for comparison
        router.push({
          pathname: "/(root)/(main)/viewer",
          params: {
            uri: encodeURIComponent(result.imageUrl),
            originalUri: encodeURIComponent(uploadedUrl),
            mode: "compare" // Indicate this is a before/after comparison
          },
        });
      }
    } catch (error) {
      console.error("Upscale failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-28">
        {/* Empty state or image preview */}
        {!imageUri ? (
          <Section>
            <View className="py-12 items-center justify-center gap-4">
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Icon name="resize-outline" size={48} color={colors.primary} />
              </View>
              <View className="items-center gap-2">
                <AppText className="text-xl font-semibold text-foreground">
                  AI Image Upscaling
                </AppText>
                <AppText className="text-center text-muted-foreground px-8">
                  Enhance resolution and quality of your images using Real-ESRGAN AI
                </AppText>
              </View>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-xl mt-2"
                onPress={handlePick}
              >
                <Button.StartContent>
                  <Icon name="image-outline" size={20} color={colors.foreground} />
                </Button.StartContent>
                <Button.LabelContent className="font-semibold">
                  Select Image
                </Button.LabelContent>
              </Button>
            </View>
          </Section>
        ) : (
          <>
            {/* Selected image preview */}
            <Section>
              <View className="gap-4">
                <Label>Selected Image</Label>
                <View className="relative">
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: '100%',
                      height: 300,
                      borderRadius: 12,
                      backgroundColor: colors.muted
                    }}
                    resizeMode="cover"
                  />
                  {isProcessing && (
                    <View
                      className="absolute inset-0 items-center justify-center"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: 12
                      }}
                    >
                      <ActivityIndicator size="large" color={colors.primary} />
                      <AppText className="text-white mt-2">
                        {isUploading ? "Uploading..." : "Upscaling..."}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            </Section>

            {/* Image info */}
            <Section>
              <View className="gap-3">
                <Label>Image Information</Label>
                {imageDimensions && (
                  <>
                    <Hint>
                      Current dimensions: {imageDimensions.width} × {imageDimensions.height} pixels
                    </Hint>
                    {imageDimensions.width * imageDimensions.height > 2000000 && (
                      <Hint className="text-warning">
                        ⚠️ Your image will be resized before processing to fit memory limits.
                      </Hint>
                    )}
                    <Hint>
                      AI will intelligently enhance and upscale your image while maintaining quality
                    </Hint>
                  </>
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
          label={isProcessing ? (isUploading ? "Uploading" : "Upscaling") : "Upscale Image"}
          disabled={isProcessing}
          loading={isProcessing}
          onPress={handleUpscale}
        />
      )}
    </View>
  );
}