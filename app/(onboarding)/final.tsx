import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingFinal() {
  const { t, currentLanguage } = useLanguage();
  const { session, user, loading: authLoading } = useAuth();
  
  // Don't automatically redirect authenticated users
  useEffect(() => {
    if (!authLoading && session && user) {
      console.log('🔄 Authenticated user on final page, but staying on page');
    }
  }, [session, user, authLoading]);

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  // Individual button handlers


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />

      {/* Full Screen Background Image */}
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Upper Section */}
      <View style={styles.upperSection}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <RNImage 
            source={require('@/assets/images/newImg/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Onboard Final Image */}
        <View style={styles.onboardImageContainer}>
          <RNImage 
            source={require('@/assets/images/newImg/onboard_final.png')} 
            style={styles.onboardImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          <View>
            <Text style={styles.welcomeTitle}>
              {t('onboarding.final.title') || 'Your Famora Account'}
            </Text>
          </View>
          
          <View>
            <Text style={styles.description}>
              {t('onboarding.final.description') || 'Create or log in to your account to experience all the features.'}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Sign In Button */}
            <Pressable
              style={styles.signInButton}
              onPress={() => {
                router.push('/(onboarding)/signin');
              }}
            >
              <Text style={styles.signInButtonText}>
                {t('onboarding.final.signIn') || 'Sign In'}
              </Text>
            </Pressable>

            {/* Sign Up Button */}
            <Pressable
              style={styles.signUpButton}
              onPress={() => {
                // Navigate to sign up page
                router.push('/(onboarding)/signup');
              }}
            >
              <Text style={styles.signUpButtonText}>
                {t('onboarding.final.signUp') || 'Sign Up'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let background image show through
    justifyContent: 'flex-end',
  },

  // Upper Section (60% of screen)
  upperSection: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent', // Let background image show through
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1, // Ensure it stays behind all content
  },

  // App Logo
  logoContainer: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
  },

  // Onboard Final Image
  onboardImageContainer: {
    position: 'absolute',
    top: 200,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  onboardImage: {
    width: screenWidth * 0.65,
    height: screenHeight * 0.22,
  },

  // Lower Section (30% of screen)
  lowerSection: {
    flex: 0.3,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 40,
    marginTop: -30,
  },
  contentCard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: 'center',
  },

  // Text Styles
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d2d2d',
    style: 'Semi Bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Helvetica',
  },
  description: {
    fontSize: 13,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
    marginBottom: 50,
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
  },
  signInButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  signUpButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
});
