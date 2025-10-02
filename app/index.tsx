import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function IndexScreen() {
  const { session, loading: authLoading, user, profile } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const { loading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const [hasNavigated, setHasNavigated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't navigate if already navigated
    if (hasNavigated) {
      return;
    }

    // Check if user is on a specific page that shouldn't be redirected
    const currentPath = segments.join('/');
    if (currentPath.includes('myProfile') || currentPath.includes('signup')) {
      console.log('🔍 User is on protected page, skipping navigation');
      return;
    }

    // Set a maximum timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (!hasNavigated) {
        console.warn('⚠️ Navigation timeout reached, forcing navigation to onboarding');
        setHasNavigated(true);
        router.replace('/(onboarding)');
      }
    }, 10000); // 10 second timeout

    // Only proceed if auth is not loading
    if (authLoading || onboardingLoading) {
      console.log('🔄 Still loading auth/onboarding, waiting...');
      return;
    }

    // If we have a session and user, navigate to main app
    if (session && user) {
      console.log('✅ User authenticated, navigating to main app');
      setHasNavigated(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      router.replace('/(tabs)');
    } else {
      // No session/user, go to onboarding
      console.log('❌ No session/user, navigating to onboarding');
      setHasNavigated(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      router.replace('/(onboarding)');
    }
  }, [session, user, authLoading, onboardingLoading, hasNavigated, segments]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show splash screen with logo only
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/newImg/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
  },
  logo: {
    width: 120,
    height: 120,
  },
});
