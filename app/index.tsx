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
  const familyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

    // Check if user is navigating to profile edit page
    const currentPath = segments.join('/');
    if (currentPath.includes('myProfile')) {
      console.log('🔍 User is on myProfile page, skipping main navigation logic');
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
    console.log('🚀 session:', !!session, 'user:', !!user, 'isInFamily:', isInFamily);
    
    // If we have a session and user, we can proceed even if family is still loading
    // This prevents infinite loading when family context times out
    if (!authLoading && !onboardingLoading && (session && user)) {
      // If family is still loading, set a timeout to proceed anyway
      if (familyLoading && !familyTimeoutRef.current) {
        console.log('🔄 Family still loading, setting 10-second timeout...');
        familyTimeoutRef.current = setTimeout(() => {
          console.log('⚠️ Family loading timeout reached, proceeding with navigation anyway');
          familyTimeoutRef.current = null;
          // Trigger navigation by calling the effect again
          navigationHandled.current = false;
        }, 10000); // 10 second timeout for family loading
        return; // Wait for timeout or family to load
      }
      console.log('🚀 All loading complete, proceeding with navigation...');
      // Clear timeouts since we're proceeding normally
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
        emergencyTimeoutRef.current = null;
      }
      if (familyTimeoutRef.current) {
        clearTimeout(familyTimeoutRef.current);
        familyTimeoutRef.current = null;
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
           const isOnProfileEditPage = currentPath.includes('myProfile/edit') || currentPath.includes('myProfile');
           const isOnSignupPage = currentPath.includes('signup');
           
           console.log('🔍 Navigation Debug Info:');
           console.log('  - segments:', segments);
           console.log('  - currentPath:', currentPath);
           console.log('  - isOnProfileEditPage:', isOnProfileEditPage);
           console.log('  - isOnSignupPage:', isOnSignupPage);
           console.log('  - isInFamily:', isInFamily);
           
           if (isOnProfileEditPage) {
             // User is on profile edit page, don't redirect them
             console.log('✅ User is on profile edit page, staying there');
             console.log('🔍 DEBUG: Profile edit page detected, currentPath:', currentPath);
             console.log('🔍 DEBUG: segments:', segments);
             return;
           }
           
           if (isOnSignupPage) {
             // User is on signup page (possibly showing welcome modal), don't redirect them
             console.log('✅ User is on signup page, staying there to show welcome modal');
             console.log('🔍 DEBUG: Skipping navigation because user is on signup page');
             return;
           }
           
           // Check if this is a new user who just completed signup verification
           // New users typically don't have a family immediately after signup
           if (!isInFamily && user?.created_at) {
             const userCreatedAt = new Date(user.created_at);
             const now = new Date();
             const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
             const isNewUser = timeSinceCreation < 5 * 60 * 1000; // Less than 5 minutes ago
             
             if (isNewUser) {
               console.log('🆕 New user detected (created recently), staying on current page for welcome flow');
               console.log('🔍 DEBUG: User created at:', user.created_at);
               console.log('🔍 DEBUG: Time since creation:', timeSinceCreation, 'ms');
               return;
             }
           }
           
           // Additional check: if user just confirmed their email, they might be in signup flow
           if (user?.email_confirmed_at) {
             const emailConfirmedAt = new Date(user.email_confirmed_at);
             const now = new Date();
             const timeSinceConfirmation = now.getTime() - emailConfirmedAt.getTime();
             const justConfirmedEmail = timeSinceConfirmation < 2 * 60 * 1000; // Less than 2 minutes ago
             
             if (justConfirmedEmail && !isInFamily) {
               console.log('📧 User just confirmed email and has no family, staying on current page for welcome flow');
               console.log('🔍 DEBUG: Email confirmed at:', user.email_confirmed_at);
               console.log('🔍 DEBUG: Time since confirmation:', timeSinceConfirmation, 'ms');
               return;
             }
           }
          
          // User is authenticated, go to main app regardless of family status
          // Note: Profile completion check is only done during signup flow (Set Up Profile button)
          // For regular sign-ins, users go to home page regardless of profile completeness or family status
          
          console.log('🚀 User ready for main app - redirecting to tabs');
          console.log('🚀 About to navigate to: /(tabs)');
          router.replace('/(tabs)');
          console.log('🚀 Navigation command sent to: /(tabs)');
        }
        }, 500); // Increased delay to 500ms to ensure all contexts are fully loaded
      };
  }, [session, user, profile, isInFamily, authLoading, familyLoading, onboardingLoading, getCompletionPercentage, segments]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
      }
      if (familyTimeoutRef.current) {
        clearTimeout(familyTimeoutRef.current);
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
