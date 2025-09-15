import { useState } from "react";
import { View, Image, Text as RNText } from "react-native";
import { Button, Switch, useTheme } from "heroui-native";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { PrimaryFooter } from "@/components/primary-footer";
import { Label, Section } from "@/components/ui";

export default function RestoreScreen() {
  const [imageUri] = useState<any>(require("@/assets/icon.png"));
  const [intensity, setIntensity] = useState(70);
  const [steps, setSteps] = useState({
    denoise: true,
    deblur: true,
    scratch: true,
    colorize: false,
    upscale: true,
    face: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { colors } = useTheme();

  const toggle = (k: keyof typeof steps) =>
    setSteps((s) => ({ ...s, [k]: !s[k] }));

  const handleRestore = async () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1000);
  };

  return (
    <View className="flex-1">
      <ScreenScrollView disableHeaderOffset contentContainerClassName="gap-5 pb-28">

      <Section>
        <View className="gap-2">
          <Label>Intensity</Label>
          <View className="flex-row items-center gap-3">
            <Button
              variant="tertiary"
              className="rounded-full"
              onPress={() => setIntensity((v) => Math.max(0, v - 5))}
            >
              <Button.LabelContent>-</Button.LabelContent>
            </Button>
            <RNText className="text-base" style={{ color: colors.foreground }}>
              {intensity}
            </RNText>
            <Button
              variant="tertiary"
              className="rounded-full"
              onPress={() => setIntensity((v) => Math.min(100, v + 5))}
            >
              <Button.LabelContent>+</Button.LabelContent>
            </Button>
          </View>
        </View>
      </Section>

      <Section>
        <View className="gap-2">
          <Label>Pipeline</Label>
          <View className="gap-3">
            <RowToggle label="Denoise" value={steps.denoise} onChange={() => toggle("denoise")} />
            <RowToggle label="Deblur" value={steps.deblur} onChange={() => toggle("deblur")} />
            <RowToggle label="Scratch repair" value={steps.scratch} onChange={() => toggle("scratch")} />
            <RowToggle label="Colorize" value={steps.colorize} onChange={() => toggle("colorize")} />
            <RowToggle label="Upscale 4×" value={steps.upscale} onChange={() => toggle("upscale")} />
            <RowToggle label="Face enhance" value={steps.face} onChange={() => toggle("face")} />
          </View>
        </View>
      </Section>

      <Section>
        <View className="gap-2">
          <Label>Before / After</Label>
          <View className="flex-row gap-8">
            <View className="items-center gap-2">
              <Image source={imageUri} style={{ width: 140, height: 140, borderRadius: 12 }} />
              <RNText className="text-xs text-muted-foreground">Before</RNText>
            </View>
            <View className="items-center gap-2">
              <Image source={imageUri} style={{ width: 140, height: 140, borderRadius: 12 }} />
              <RNText className="text-xs text-muted-foreground">After (preview)</RNText>
            </View>
          </View>
        </View>
      </Section>

      </ScreenScrollView>
      <PrimaryFooter
        label={isProcessing ? "Restoring" : "Restore"}
        loading={isProcessing}
        onPress={handleRestore}
      />
    </View>
  );
}

function RowToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <RNText className="text-base text-foreground">{label}</RNText>
      <Switch checked={value} onCheckedChange={onChange} />
    </View>
  );
}
