import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CoolLoadingScreen from '@/components/CoolLoadingScreen';

export default function OnboardingLayout() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!authLoading && session && user) {
      console.log('🚫 User is already authenticated, redirecting from onboarding to home...');
      router.replace('/(tabs)');
    }
  }, [session, user, authLoading, router]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return <CoolLoadingScreen message="Checking authentication..." />;
  }

  // If user is authenticated, don't render the onboarding stack
  if (session && user) {
    return <CoolLoadingScreen message="Redirecting to home..." />;
  }

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
