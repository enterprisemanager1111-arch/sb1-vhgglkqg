import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IndexScreen() {
  const { session, loading: authLoading, user } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const { getCompletionPercentage, loading: onboardingLoading } = useOnboarding();
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
      };

      checkWelcomeModal();
    }
  }, [session, user, isInFamily, authLoading, familyLoading, onboardingLoading, getCompletionPercentage]);

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
