import { View, Text, Image, Pressable, ActivityIndicator, RefreshControl, Dimensions, Alert, ScrollView } from "react-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useCurrentUser } from "@/lib/hooks/useUser";
import { useUserImages, useDeleteImage } from "@/lib/hooks/useImages";
import { useRouter } from "expo-router";
import { useTheme } from "heroui-native";
import { Icon } from "@/components/Icon";
import { useState, useCallback } from "react";
import { ChipOption, Label, Section, Hint } from "@/components/ui";
import { AppText } from "@/components/app-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

const IMAGE_TYPES = ["all", "generated", "edited", "upscaled", "bg-removed"] as const;
type ImageType = typeof IMAGE_TYPES[number];

const { width: screenWidth } = Dimensions.get("window");
const imageSize = (screenWidth - 6) / 3; // 3 columns with minimal padding

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [selectedType, setSelectedType] = useState<ImageType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const headerHeight = useHeaderHeight();
  
  // Get user images
  const images = useUserImages(user?._id, selectedType === "all" ? undefined : selectedType);
  const deleteImage = useDeleteImage();
  
  const handleImagePress = (imageUrl: string) => {
    router.push({
      pathname: "/(root)/(main)/viewer",
      params: { uri: encodeURIComponent(imageUrl) },
    });
  };
  
  const handleImageLongPress = (imageId: any, imageUrl: string) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (user?._id) {
              try {
                await deleteImage(imageId, user._id);
              } catch (error) {
                console.error("Failed to delete image:", error);
              }
            }
          },
        },
      ]
    );
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The query will auto-refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);
  
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: colors.mutedForeground }}>Please sign in to view your library</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1">
      <ScreenScrollView 
        disableHeaderOffset
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        {/* Filter chips with negative margins to extend full width */}
        <View style={{ marginHorizontal: -20, marginBottom: 12 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}
          >
            {IMAGE_TYPES.map((type) => (
              <ChipOption
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Images grid */}
        <View>
          {images === undefined ? (
            // Loading state
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : images.length === 0 ? (
            // Empty state with modern design
            <View className="items-center justify-center py-24">
              <View className="items-center gap-6">
                <View className="relative">
                  <View className="w-28 h-28 rounded-3xl items-center justify-center" 
                    style={{ 
                      backgroundColor: colors.primary + '15',
                      borderWidth: 1,
                      borderColor: colors.primary + '20',
                    }}>
                    <Icon name="images-outline" size={52} color={colors.primary} />
                  </View>
                  <View className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}>
                    <Icon name="sparkles" size={18} color={colors.background} />
                  </View>
                </View>
                
                <View className="items-center gap-3">
                  <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                    {selectedType === "all" ? "Your creative journey starts here" : `No ${selectedType.replace("-", " ")} images`}
                  </Text>
                  <Text className="text-center text-base px-12 leading-5" style={{ color: colors.mutedForeground }}>
                    {selectedType === "all" 
                      ? "Transform your ideas into stunning visuals with AI-powered image generation" 
                      : `Start creating ${selectedType.replace("-", " ")} images to see them here`}
                  </Text>
                </View>
                
                <Pressable
                  onPress={() => router.push("/(root)/(main)/(studio)/create")}
                  className="mt-2 px-10 py-4 rounded-2xl flex-row items-center gap-3 shadow-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <Icon name="add-circle-outline" size={22} color={colors.background} />
                  <Text style={{ color: colors.background }} className="font-bold text-base">
                    Create Image
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // Images grid
            <>
              <View className="flex-row justify-between items-center px-4 pb-3">
                <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
                  Your Images
                </Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {images.length} {images.length === 1 ? "item" : "items"}
                </Text>
              </View>
              
              <View className="flex-row flex-wrap">
                {images.map((image, index) => (
                  <Pressable
                    key={image._id}
                    onPress={() => handleImagePress(image.imageUrl)}
                    onLongPress={() => handleImageLongPress(image._id, image.imageUrl)}
                    style={{ 
                      width: imageSize, 
                      height: imageSize,
                      padding: 1, // Minimal spacing between images
                    }}
                  >
                    <View 
                      className="overflow-hidden rounded-md"
                      style={{ 
                        width: "100%", 
                        height: "100%",
                        backgroundColor: colors.muted,
                      }}
                    >
                      <Image
                        source={{ uri: image.thumbnailUrl || image.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      
                      {/* Status overlay */}
                      {image.status === "processing" && (
                        <View className="absolute inset-0 bg-black/60 items-center justify-center">
                          <ActivityIndicator color="white" />
                          <Text className="text-white text-xs mt-1 font-medium">Processing</Text>
                        </View>
                      )}
                      
                      {image.status === "failed" && (
                        <View className="absolute inset-0 bg-black/60 items-center justify-center">
                          <Icon name="alert-circle-outline" size={24} color="#ef4444" />
                          <Text className="text-white text-xs mt-1 font-medium">Failed</Text>
                        </View>
                      )}
                      
                      {/* Subtle gradient overlay for text readability */}
                      <View className="absolute inset-0">
                        <View className="absolute bottom-0 left-0 right-0 h-20"
                          style={{
                            backgroundColor: 'transparent',
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                          }}
                        />
                      </View>
                      
                      {/* Type indicator with minimal design */}
                      <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between">
                        <Text className="text-xs font-semibold text-white capitalize" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                          {image.type.replace("-", " ")}
                        </Text>
                        {image.createdAt && (
                          <Text className="text-xs text-white/70" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                            {new Date(image.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
              
              {/* Stats section with cards */}
              <View className="px-4 mt-8 mb-6">
                <Text className="text-xs font-bold mb-4 tracking-wide" style={{ color: colors.mutedForeground }}>OVERVIEW</Text>
                <View className="gap-3">
                  {/* Total images card */}
                  <View className="p-4 rounded-2xl flex-row justify-between items-center"
                    style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border + '20' }}>
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: colors.primary + '15' }}>
                        <Icon name="images-outline" size={20} color={colors.primary} />
                      </View>
                      <Text className="text-base font-medium" style={{ color: colors.foreground }}>Total Images</Text>
                    </View>
                    <Text style={{ color: colors.primary }} className="font-bold text-xl">
                      {images.length}
                    </Text>
                  </View>
                  
                  {/* Type breakdown */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 p-3 rounded-xl"
                      style={{ backgroundColor: colors.muted + '50' }}>
                      <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Generated</Text>
                      <Text className="font-bold text-lg" style={{ color: colors.foreground }}>
                        {images.filter(img => img.type === "generated").length}
                      </Text>
                    </View>
                    <View className="flex-1 p-3 rounded-xl"
                      style={{ backgroundColor: colors.muted + '50' }}>
                      <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Edited</Text>
                      <Text className="font-bold text-lg" style={{ color: colors.foreground }}>
                        {images.filter(img => img.type === "edited").length}
                      </Text>
                    </View>
                    <View className="flex-1 p-3 rounded-xl"
                      style={{ backgroundColor: colors.muted + '50' }}>
                      <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Upscaled</Text>
                      <Text className="font-bold text-lg" style={{ color: colors.foreground }}>
                        {images.filter(img => img.type === "upscaled").length}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScreenScrollView>
    </View>
  );
}