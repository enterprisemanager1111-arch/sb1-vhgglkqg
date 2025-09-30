import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingLayout() {
  const { session, user, profile, loading: authLoading } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check for auth token in AsyncStorage immediately for faster protection
    const checkAuthToken = async () => {
      try {
        const authToken = await AsyncStorage.getItem('sb-eqaxmxbqqiuiwkhjwvvz-auth-token');
        if (authToken && !authLoading) {
          console.log('🔒 Auth token found, user should not access onboarding pages');
          
          // If there's an auth token but auth is failing, it might be corrupted
          if (!session && !user) {
            console.log('🔍 Auth token exists but no session/user - possible network/token issue');
            // Let the auth context handle cleanup, just proceed with normal flow for now
          }
          
          // Get current path to check if it's an allowed page
          const currentPath = segments.join('/');
          const isOnPasswordResetPage = currentPath.includes('resetPwd');
          const isOnEnterNewPwdPage = currentPath.includes('enterNewPwd');
          const isOnNewFamilyPage = currentPath.includes('newFamily');
          const isOnWorkProfileEmptyPage = currentPath.includes('workProfileEmpty');
          const isOnProfileEditPage = currentPath.includes('myProfile/edit');
          
          // Allow only specific pages for authenticated users
          if (isOnPasswordResetPage || isOnEnterNewPwdPage || isOnProfileEditPage) {
            console.log('🔄 Auth token found but user on allowed page:', currentPath);
            return;
          }
          
          // For newFamily pages, only allow if user doesn't have a family
          if (isOnNewFamilyPage || isOnWorkProfileEmptyPage) {
            // Wait for family loading to complete before making decision
            if (!familyLoading) {
              if (!isInFamily) {
                console.log('🔄 Auth token found, user has no family, allowing newFamily page access');
                return;
              } else {
                console.log('🚫 Auth token found, user already has family, redirecting from newFamily page');
                router.replace('/(tabs)');
                return;
              }
            } else {
              console.log('🔄 Auth token found, waiting for family loading to complete...');
              return; // Wait for family loading to complete
            }
          }
          
          // For all other onboarding pages, redirect immediately
          console.log('🚫 Auth token found, redirecting from onboarding page:', currentPath);
          router.replace('/(tabs)');
          return;
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
      }
    };
    
    checkAuthToken();
    
    // Only redirect if we're not loading and user is authenticated
    if (!authLoading && session && user) {
      // Add a small delay to ensure signup page logic runs first
      const timeoutId = setTimeout(async () => {
        // Check if welcome modal should be shown before redirecting
        const checkWelcomeModal = async () => {
          try {
            const showingWelcomeModal = await AsyncStorage.getItem('showing_welcome_modal');
            const isVerifyingSignup = await AsyncStorage.getItem('is_verifying_signup');
            
            // Check if current route is a password reset page, new family page, or profile edit page
            const currentPath = segments.join('/');
            const isOnPasswordResetPage = currentPath.includes('resetPwd');
            const isOnEnterNewPwdPage = currentPath.includes('enterNewPwd');
            const isOnNewFamilyPage = currentPath.includes('newFamily');
            const isOnWorkProfileEmptyPage = currentPath.includes('workProfileEmpty');
            const isOnSignupPage = currentPath.includes('signup');
            const isOnProfileEditPage = currentPath.includes('myProfile/edit');
            
            if (showingWelcomeModal === 'true' || isVerifyingSignup === 'true') {
              console.log('🔄 Welcome modal or signup verification in progress, staying on onboarding page');
              return; // Don't redirect, let the signup page handle the welcome modal
            }
            
                // Only allow authenticated users on these specific pages:
                // - Password reset pages (they might need to reset password even when logged in)
                // - New family pages (authenticated users without family ONLY)
                // - Profile edit pages (authenticated users editing profile)
                // - Final page (temporary access for redirect purposes)
                // DO NOT allow: signup, signin, language, personal, preferences, permissions, auth, family setup, etc.
                const isOnFinalPage = currentPath.includes('final');
                if (isOnPasswordResetPage || isOnEnterNewPwdPage || isOnProfileEditPage || isOnFinalPage) {
                  console.log('🔄 User on allowed authenticated page, allowing access');
                  return; // Don't redirect, allow special flow
                }
            
            // For newFamily pages, check family status
            if (isOnNewFamilyPage || isOnWorkProfileEmptyPage) {
              // Wait for family loading to complete
              if (!familyLoading) {
                if (!isInFamily) {
                  console.log('🔄 User has no family, allowing newFamily page access');
                  return;
                } else {
                  console.log('🚫 User already has family, redirecting from newFamily page');
                  router.replace('/(tabs)');
                  return;
                }
              } else {
                console.log('🔄 Waiting for family loading to complete before allowing newFamily access...');
                return; // Wait for family loading
              }
            }
            
            // IMPORTANT: Do not allow signup/signin pages for authenticated users
            if (isOnSignupPage) {
              console.log('🚫 Authenticated user trying to access signup page, redirecting to home');
              router.replace('/(tabs)');
              return;
            }
            
            // For authenticated users on onboarding pages, redirect to home
            // Note: Profile completion check is only done during signup flow (Set Up Profile button)
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
      }, 100); // Small delay to let signup page logic run first
      
        return () => clearTimeout(timeoutId);
      }
    }, [session, user, profile, authLoading, familyLoading, isInFamily, router, segments]);

  // Show loading screen while checking authentication or family status
  if (authLoading || (session && user && familyLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {authLoading ? 'Checking authentication...' : 'Loading family data...'}
        </Text>
        <ActivityIndicator size="large" color="#17f196" />
      </View>
    );
  }

  // If user is authenticated, don't render the onboarding stack
  // But allow rendering if welcome modal should be shown
  if (session && user && !authLoading && !familyLoading) {
    const currentPath = segments.join('/');
    const isOnPasswordResetPage = currentPath.includes('resetPwd');
    const isOnNewFamilyPage = currentPath.includes('newFamily');
    const isOnWorkProfileEmptyPage = currentPath.includes('workProfileEmpty');
    const isOnProfileEditPage = currentPath.includes('myProfile/edit');
    const isOnFinalPage = currentPath.includes('final');
    
    // Always allow password reset, profile edit, and final pages
    const isOnAlwaysAllowedPage = isOnPasswordResetPage || isOnProfileEditPage || isOnFinalPage;
    
    // Only allow newFamily pages if user doesn't have a family
    const isOnConditionallyAllowedPage = (isOnNewFamilyPage || isOnWorkProfileEmptyPage) && !isInFamily;
    
    const isOnAllowedPage = isOnAlwaysAllowedPage || isOnConditionallyAllowedPage;
    
    // If not on an allowed page, show loading while redirecting
    if (!isOnAllowedPage) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirecting...</Text>
          <ActivityIndicator size="large" color="#17f196" />
        </View>
      );
    }
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
      <Stack.Screen name="newFamily" />
      <Stack.Screen name="newFamily/workProfileEmpty" />
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
