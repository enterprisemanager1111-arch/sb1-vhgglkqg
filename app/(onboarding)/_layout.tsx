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
          
          // Allow only specific pages for authenticated users
          // Note: myProfile/edit is handled by the main app layout, not onboarding layout
          if (isOnPasswordResetPage || isOnEnterNewPwdPage) {
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
                console.log('🚫 Auth token found, user already has family, but staying on newFamily page');
                return;
              }
            } else {
              console.log('🔄 Auth token found, waiting for family loading to complete...');
              return; // Wait for family loading to complete
            }
          }
          
          // Check if this is a new user on signup page before redirecting
          if (currentPath.includes('signup')) {
            // Check if this is a new user (created recently)
            if (user?.created_at) {
              const userCreatedAt = new Date(user.created_at);
              const now = new Date();
              const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
              const isNewUser = timeSinceCreation < 10 * 60 * 1000; // Less than 10 minutes ago
              
              if (isNewUser) {
                console.log('🆕 New user on signup page (auth token check), allowing welcome modal to show');
                console.log('🔍 DEBUG: User created at:', user.created_at);
                console.log('🔍 DEBUG: Time since creation:', timeSinceCreation, 'ms');
                return; // Allow signup page for new users
              }
            }
            
            // Check if user just confirmed their email
            if (user?.email_confirmed_at) {
              const emailConfirmedAt = new Date(user.email_confirmed_at);
              const now = new Date();
              const timeSinceConfirmation = now.getTime() - emailConfirmedAt.getTime();
              const justConfirmedEmail = timeSinceConfirmation < 5 * 60 * 1000; // Less than 5 minutes ago
              
              if (justConfirmedEmail && !isInFamily) {
                console.log('📧 User just confirmed email on signup page (auth token check), allowing welcome modal to show');
                console.log('🔍 DEBUG: Email confirmed at:', user.email_confirmed_at);
                console.log('🔍 DEBUG: Time since confirmation:', timeSinceConfirmation, 'ms');
                return; // Allow signup page for recently confirmed users
              }
            }
          }
          
          // Don't automatically redirect from onboarding pages
          console.log('🚫 Auth token found, but staying on onboarding page:', currentPath);
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
        // Check if user is on allowed pages before redirecting
        const checkAllowedPages = async () => {
          try {
            // Check if current route is a password reset page, new family page, or signup page
            const currentPath = segments.join('/');
            const isOnPasswordResetPage = currentPath.includes('resetPwd');
            const isOnEnterNewPwdPage = currentPath.includes('enterNewPwd');
            const isOnNewFamilyPage = currentPath.includes('newFamily');
            const isOnWorkProfileEmptyPage = currentPath.includes('workProfileEmpty');
            const isOnSignupPage = currentPath.includes('signup');
            
            // Early exit: If user is not on any onboarding page, don't interfere
            // This prevents the onboarding layout from redirecting users who have navigated away
            if (!isOnPasswordResetPage && !isOnEnterNewPwdPage && !isOnNewFamilyPage && 
                !isOnWorkProfileEmptyPage && !isOnSignupPage && 
                !currentPath.includes('language') && !currentPath.includes('personal') && 
                !currentPath.includes('preferences') && !currentPath.includes('permissions') && 
                !currentPath.includes('auth') && !currentPath.includes('overview') && 
                !currentPath.includes('signin') && !currentPath.includes('final')) {
              console.log('🔍 User is not on an onboarding page, onboarding layout will not interfere');
              return;
            }
            
            // Check if user is in signup verification flow (using time-based detection)
            if (isOnSignupPage) {
              // Check if this is a new user (created recently)
              if (user?.created_at) {
                const userCreatedAt = new Date(user.created_at);
                const now = new Date();
                const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
                const isNewUser = timeSinceCreation < 10 * 60 * 1000; // Less than 10 minutes ago
                
                if (isNewUser) {
                  console.log('🆕 New user on signup page (main navigation), allowing welcome modal to show');
                  console.log('🔍 DEBUG: User created at:', user.created_at);
                  console.log('🔍 DEBUG: Time since creation:', timeSinceCreation, 'ms');
                  return; // Allow signup page for new users
                }
              }
              
              // Check if user just confirmed their email
              if (user?.email_confirmed_at) {
                const emailConfirmedAt = new Date(user.email_confirmed_at);
                const now = new Date();
                const timeSinceConfirmation = now.getTime() - emailConfirmedAt.getTime();
                const justConfirmedEmail = timeSinceConfirmation < 5 * 60 * 1000; // Less than 5 minutes ago
                
                if (justConfirmedEmail && !isInFamily) {
                  console.log('📧 User just confirmed email on signup page (main navigation), allowing welcome modal to show');
                  console.log('🔍 DEBUG: Email confirmed at:', user.email_confirmed_at);
                  console.log('🔍 DEBUG: Time since confirmation:', timeSinceConfirmation, 'ms');
                  return; // Allow signup page for recently confirmed users
                }
              }
            }
            
            // Check if user is on sign-in page after successful authentication
            const isOnSigninPage = currentPath.includes('signin');
            if (isOnSigninPage) {
              console.log('🔐 User on sign-in page after authentication, allowing sign-in page to handle navigation');
              return; // Allow sign-in page to handle its own navigation logic
            }
            
                // Only allow authenticated users on these specific pages:
                // - Password reset pages (they might need to reset password even when logged in)
                // - New family pages (authenticated users without family ONLY)
                // - Final page (temporary access for redirect purposes)
                // - Personal page (allow authenticated users to access personal info page)
                // Note: Profile edit pages are handled by the main app layout, not onboarding layout
                // DO NOT allow: signup, signin, language, preferences, permissions, auth, family setup, etc.
                const isOnFinalPage = currentPath.includes('final');
                const isOnPersonalPage = currentPath.includes('personal');
                if (isOnPasswordResetPage || isOnEnterNewPwdPage || isOnFinalPage || isOnPersonalPage) {
                  console.log('🔄 User on allowed authenticated page, allowing access');
                  console.log('🔍 DEBUG: Current path:', currentPath);
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
                  console.log('🚫 User already has family, but staying on newFamily page');
                  return;
                }
              } else {
                console.log('🔄 Waiting for family loading to complete before allowing newFamily access...');
                return; // Wait for family loading
              }
            }
            
            // Don't automatically redirect authenticated users from onboarding pages
            console.log('🚫 Authenticated user on onboarding page, but staying on page');
            return;
          } catch (error) {
            console.error('Error checking allowed pages:', error);
            // If there's an error, don't redirect automatically
            console.log('🚫 User is already authenticated, but staying on onboarding page...');
          }
        };
        
        checkAllowedPages();
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
    const isOnFinalPage = currentPath.includes('final');
    const isOnSignupPage = currentPath.includes('signup');
    
    // Always allow password reset and final pages
    // Note: Profile edit pages are handled by the main app layout, not onboarding layout
    const isOnAlwaysAllowedPage = isOnPasswordResetPage || isOnFinalPage;
    
    // Only allow newFamily pages if user doesn't have a family
    const isOnConditionallyAllowedPage = (isOnNewFamilyPage || isOnWorkProfileEmptyPage) && !isInFamily;
    
    // Allow signup page for new users to show welcome modal
    let isOnSignupAllowedPage = false;
    if (isOnSignupPage) {
      // Check if this is a new user (created recently)
      if (user?.created_at) {
        const userCreatedAt = new Date(user.created_at);
        const now = new Date();
        const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
        const isNewUser = timeSinceCreation < 10 * 60 * 1000; // Less than 10 minutes ago
        
        if (isNewUser) {
          isOnSignupAllowedPage = true;
        }
      }
      
      // Check if user just confirmed their email
      if (!isOnSignupAllowedPage && user?.email_confirmed_at) {
        const emailConfirmedAt = new Date(user.email_confirmed_at);
        const now = new Date();
        const timeSinceConfirmation = now.getTime() - emailConfirmedAt.getTime();
        const justConfirmedEmail = timeSinceConfirmation < 5 * 60 * 1000; // Less than 5 minutes ago
        
        if (justConfirmedEmail && !isInFamily) {
          isOnSignupAllowedPage = true;
        }
      }
    }
    
    const isOnAllowedPage = isOnAlwaysAllowedPage || isOnConditionallyAllowedPage || isOnSignupAllowedPage;
    
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
