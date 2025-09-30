import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const { session, loading: authLoading, user, profile } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const { getCompletionPercentage, loading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const navigationHandled = useRef(false);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset navigation handler when auth/family state changes significantly
  useEffect(() => {
    const resetNavigationHandler = () => {
      if (navigationHandled.current) {
        console.log('🚀 Resetting navigation handler due to state change');
        navigationHandled.current = false;
      }
    };
    
    // Reset when we get a new session or user, or when family status changes
    resetNavigationHandler();
  }, [session?.user?.id, isInFamily]);

  useEffect(() => {
    // Prevent infinite re-renders by only handling navigation once
    if (navigationHandled.current) {
      console.log('🚀 Navigation already handled, skipping...');
      return;
    }

    // Emergency timeout to prevent infinite loading (25 seconds)
    if (!emergencyTimeoutRef.current) {
      emergencyTimeoutRef.current = setTimeout(() => {
        if (!navigationHandled.current) {
          console.warn('⚠️ Emergency timeout reached, forcing navigation');
          navigationHandled.current = true;
          // Default to onboarding if we're still stuck
          router.replace('/(onboarding)');
        }
      }, 25000);
    }

    // Only navigate once all states are loaded
    console.log('🚀 Checking if ready to navigate...');
    console.log('🚀 authLoading:', authLoading, 'familyLoading:', familyLoading, 'onboardingLoading:', onboardingLoading);
    
    if (!authLoading && !familyLoading && !onboardingLoading) {
      console.log('🚀 All loading complete, proceeding with navigation...');
      // Clear emergency timeout since we're proceeding normally
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
      // Check if welcome modal is being shown
      const checkWelcomeModal = async () => {
        try {
          const showingWelcomeModal = await AsyncStorage.getItem('showing_welcome_modal');
          if (showingWelcomeModal === 'true') {
            console.log('Welcome modal is being shown, skipping navigation');
            return;
          }
        } catch (error) {
          console.error('Error checking welcome modal flag:', error);
        }

        // Add a small delay to allow segments to update after navigation
        setTimeout(async () => {
          navigationHandled.current = true;
          console.log('🚀 === NAVIGATION DECISION DEBUG ===');
          console.log('🚀 session:', !!session);
          console.log('🚀 user:', !!user);
          console.log('🚀 isInFamily:', isInFamily);
          console.log('🚀 authLoading:', authLoading);
          console.log('🚀 familyLoading:', familyLoading);
          console.log('🚀 onboardingLoading:', onboardingLoading);
          console.log('🚀 segments:', segments);
          console.log('🚀 currentPath:', segments.join('/'));
          console.log('🚀 === END DEBUG ===');
        
        if (!session || !user) {
          // Double-check AsyncStorage for auth token
          try {
            const authToken = await AsyncStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
            if (authToken) {
              console.log('🔍 Auth token found but no session/user, waiting for auth to load...');
              return; // Wait for auth context to properly load
            }
          } catch (error) {
            console.error('Error checking auth token:', error);
          }
          
          // User is not authenticated, go to onboarding
          console.log('Redirecting to onboarding (no auth)');
          router.replace('/(onboarding)');
        } else {
          // User is authenticated, check current route first
          const currentPath = segments.join('/');
          const isOnProfileEditPage = currentPath.includes('myProfile/edit');
          
          console.log('🔍 Navigation Debug Info:');
          console.log('  - segments:', segments);
          console.log('  - currentPath:', currentPath);
          console.log('  - isOnProfileEditPage:', isOnProfileEditPage);
          console.log('  - isInFamily:', isInFamily);
          
          if (isOnProfileEditPage) {
            // User is on profile edit page, don't redirect them
            console.log('✅ User is on profile edit page, staying there');
            return;
          }
          
          // User is authenticated, check family status
          // Note: Profile completion check is only done during signup flow (Set Up Profile button)
          // For regular sign-ins, users go to home page regardless of profile completeness
          
          if (!isInFamily) {
            // User has no family, send to new family page
            console.log('🚀 User has no family, redirecting to new family page');
            console.log('🚀 About to navigate to: /(onboarding)/newFamily');
            router.replace('/(onboarding)/newFamily');
            console.log('🚀 Navigation command sent to: /(onboarding)/newFamily');
          } else {
            // User is authenticated and is in a family, go to main app
            console.log('🚀 User ready for main app - redirecting to tabs');
            console.log('🚀 About to navigate to: /(tabs)');
            router.replace('/(tabs)');
            console.log('🚀 Navigation command sent to: /(tabs)');
          }
        }
        }, 500); // Increased delay to 500ms to ensure all contexts are fully loaded
      };

      checkWelcomeModal();
    }
  }, [session, user, profile, isInFamily, authLoading, familyLoading, onboardingLoading, getCompletionPercentage, segments]);

  // Cleanup emergency timeout on unmount
  useEffect(() => {
    return () => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
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
