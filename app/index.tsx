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

  useEffect(() => {
    // Prevent infinite re-renders by only handling navigation once
    if (navigationHandled.current) {
      return;
    }

    // Only navigate once all states are loaded
    if (!authLoading && !familyLoading && !onboardingLoading) {
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
        setTimeout(() => {
          navigationHandled.current = true;
          console.log('Navigation decision - session:', !!session, 'isInFamily:', isInFamily);
        
        if (!session || !user) {
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
            console.log('User has no family, redirecting to new family page');
            router.replace('/(onboarding)/newFamily');
          } else {
            // User is authenticated and is in a family, go to main app
            console.log('User ready for main app - redirecting to tabs');
            router.replace('/(tabs)');
          }
        }
        }, 200); // 200ms delay to allow segments to update
      };

      checkWelcomeModal();
    }
  }, [session, user, profile, isInFamily, authLoading, familyLoading, onboardingLoading, getCompletionPercentage, segments]);

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
