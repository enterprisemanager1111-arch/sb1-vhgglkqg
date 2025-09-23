import { Stack } from 'expo-router';

export default function MyProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="edit" />
    </Stack>
  );
}
