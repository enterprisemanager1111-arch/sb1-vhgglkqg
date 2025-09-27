import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingLayout() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!authLoading && session && user) {
      // Check if welcome modal should be shown before redirecting
      const checkWelcomeModal = async () => {
        try {
          const showingWelcomeModal = await AsyncStorage.getItem('showing_welcome_modal');
          const isVerifyingSignup = await AsyncStorage.getItem('is_verifying_signup');
          
          // Check if current route is a password reset page
          const isOnPasswordResetPage = segments.includes('resetPwd');
          const isOnEnterNewPwdPage = segments.includes('enterNewPwd');
          
          if (showingWelcomeModal === 'true' || isVerifyingSignup === 'true') {
            console.log('🔄 Welcome modal or signup verification in progress, staying on onboarding page');
            return; // Don't redirect, let the signup page handle the welcome modal
          }
          
          // If user is on password reset pages, allow them to stay there
          if (isOnPasswordResetPage || isOnEnterNewPwdPage) {
            console.log('🔄 User on password reset page, allowing access');
            return; // Don't redirect, allow password reset flow
          }
          
          console.log('🚫 User is already authenticated, redirecting from onboarding to home...');
          router.replace('/(tabs)');
        } catch (error) {
          console.error('Error checking welcome modal flag:', error);
          // If there's an error, proceed with normal redirect
          console.log('🚫 User is already authenticated, redirecting from onboarding to home...');
          router.replace('/(tabs)');
        }
      };
      
      checkWelcomeModal();
    }
  }, [session, user, authLoading, router, segments]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking authentication...</Text>
        <ActivityIndicator size="large" color="#17f196" />
      </View>
    );
  }

  // If user is authenticated, don't render the onboarding stack
  // But allow rendering if welcome modal should be shown
  if (session && user && !authLoading) {
    // We'll let the useEffect handle the redirect logic
    // This prevents the immediate redirect that was blocking the welcome modal
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
      <Stack.Screen name="resetPwd/index" />
      <Stack.Screen name="resetPwd/enterNewPwd" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
});
