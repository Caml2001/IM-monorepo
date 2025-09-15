import { useState } from "react";
import { View, Image, Text as RNText } from "react-native";
import { Button, Switch, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section, ChipOption } from "@/components/ui";

const FACTORS = ["2x", "4x"] as const;

export default function ScaleScreen() {
  const { colors } = useTheme();
  const [imageUri] = useState<any>(require("@/assets/icon.png"));
  const [factor, setFactor] = useState<(typeof FACTORS)[number]>("2x");
  const [face, setFace] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 700);
  };

  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-28">

      <Section>
        <View className="gap-2">
          <Label>Factor</Label>
          <View className="flex-row gap-2">
            {FACTORS.map((f) => (
              <ChipOption key={f} label={f} selected={factor === f} onPress={() => setFactor(f)} />
            ))}
          </View>
        </View>
      </Section>

      <Section>
        <View className="flex-row items-center justify-between">
          <Label>Face Enhance</Label>
          <Switch checked={face} onCheckedChange={setFace} />
        </View>
      </Section>

      <Section>
        <View className="gap-2">
          <Label>Preview</Label>
          <View className="flex-row gap-8">
            <View className="items-center gap-2">
              <Image source={imageUri} style={{ width: 140, height: 140, borderRadius: 12 }} />
              <RNText className="text-xs text-muted-foreground">Original</RNText>
            </View>
            <View className="items-center gap-2">
              <Image source={imageUri} style={{ width: 140, height: 140, borderRadius: 12 }} />
              <RNText className="text-xs text-muted-foreground">{factor} (preview)</RNText>
            </View>
          </View>
        </View>
      </Section>

      </ScreenScrollView>
      <PrimaryFooter
        label={isProcessing ? "Scaling" : "Scale"}
        loading={isProcessing}
        onPress={handleProcess}
      />
    </View>
  );
}
