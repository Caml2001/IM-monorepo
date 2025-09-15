import { View, Image, type ImageSourcePropType } from "react-native";
import { AppText } from "./app-text";

type Props = {
  source: ImageSourcePropType;
  label?: string;
};

export function PreviewCard({ source, label }: Props) {
  return (
    <View className="w-[160px] gap-2">
      <View className="h-[160px] w-[160px] overflow-hidden rounded-xl border border-border">
        <Image source={source} style={{ width: 160, height: 160 }} resizeMode="cover" />
      </View>
      {label ? <AppText className="text-xs text-muted-foreground">{label}</AppText> : null}
    </View>
  );
}

