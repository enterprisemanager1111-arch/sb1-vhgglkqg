import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import SupabaseStatus from '@/components/SupabaseStatus';
import CoolLoadingScreen from '@/components/CoolLoadingScreen';

export default function IndexScreen() {
  const { session, loading: authLoading, user } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const { getCompletionPercentage, loading: onboardingLoading } = useOnboarding();
  const { loading: languageLoading, t } = useLanguage();
  const navigationHandled = useRef(false);

  useEffect(() => {
    // Prevent infinite re-renders by only handling navigation once
    if (navigationHandled.current) {
      return;
    }

    // Only navigate once all states are loaded (including language)
    if (!authLoading && !familyLoading && !onboardingLoading && !languageLoading) {
      navigationHandled.current = true;
      console.log('Navigation decision - session:', !!session, 'isInFamily:', isInFamily);
      
      if (!session || !user) {
        // User is not authenticated, go to onboarding
        console.log('Redirecting to onboarding (no auth)');
        router.replace('/(onboarding)');
      } else if (!isInFamily) {
        // Check if user has completed initial onboarding
        const completionPercentage = getCompletionPercentage();
        
        if (completionPercentage === 0) {
          // Brand new user - start from welcome screen
          console.log('Redirecting to onboarding (new user)');
          router.replace('/(onboarding)');
        } else {
          // User has some progress - send them to complete personal info first
          console.log('User has authentication but no family - ensuring personal info is complete');
          // Send to personal info to ensure name is collected properly
          router.replace('/(onboarding)/personal');
        }
      } else {
        // User is authenticated and in a family, go to main app
        console.log('Redirecting to main app');
        router.replace('/(tabs)');
      }
    }
  }, [session, user, isInFamily, authLoading, familyLoading, onboardingLoading, languageLoading, getCompletionPercentage]);

  // Show loading screen while determining navigation route
  if (authLoading || familyLoading || onboardingLoading || languageLoading) {
    const loadingMessage = authLoading ? 'Authenticating...' : 
                          familyLoading ? 'Loading family...' : 
                          languageLoading ? 'Loading language...' :
                          'Loading onboarding...';
    return <CoolLoadingScreen message={loadingMessage} />;
  }

  // Fallback loading state (should rarely be seen due to useEffect navigation)
  return <CoolLoadingScreen message={t('common.redirecting') || 'Redirecting...'} />;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
});
