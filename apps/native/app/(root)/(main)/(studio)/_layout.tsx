import { Stack } from "expo-router";

export default function StudioStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="scale" options={{ headerShown: false }} />
      <Stack.Screen name="restore" options={{ headerShown: false }} />
    </Stack>
  );
}
