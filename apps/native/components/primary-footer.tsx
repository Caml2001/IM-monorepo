import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { useRef } from "react";
import { Button } from "heroui-native";

type Props = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

export function PrimaryFooter({ label, disabled, loading, onPress }: Props) {
  const insets = useSafeAreaInsets();
  // Freeze the bottom inset on first render to avoid initial layout jump
  const initialBottomInset = useRef<number>(
    Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 0),
  );
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
      <View
        pointerEvents="auto"
        style={{
          marginHorizontal: 20,
          marginBottom: initialBottomInset.current + 12,
        }}
      >
        <Button className="rounded-full" disabled={disabled || loading} onPress={onPress}>
          <Button.LabelContent>{loading ? `${label}…` : label}</Button.LabelContent>
        </Button>
      </View>
    </View>
  );
}
