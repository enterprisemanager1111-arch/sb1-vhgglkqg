import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="personal" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="family" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="final" />
    </Stack>
  );
}