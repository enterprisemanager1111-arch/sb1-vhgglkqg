import React from 'react';
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
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingFinal() {
  const { t, currentLanguage } = useLanguage();
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />

      {/* Upper Section with Background Image */}
      <View style={styles.upperSection}>
        <RNImage 
          source={require('@/assets/images/newImg/background.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
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
          <Text style={styles.welcomeTitle}>
            Your Famora Account
          </Text>
          
          <Text style={styles.description}>
            Create or log in to your account to experience all the features.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Sign In Button */}
            <AnimatedPressable
              style={[styles.signInButton, buttonAnimatedStyle]}
              onPress={() => {
                router.push('/(onboarding)/signin');
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={styles.signInButtonText}>
                Sign In
              </Text>
            </AnimatedPressable>

            {/* Sign Up Button */}
            <AnimatedPressable
              style={[styles.signUpButton, buttonAnimatedStyle]}
              onPress={() => {
                // Navigate to sign up flow
                router.replace('/(tabs)');
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={styles.signUpButtonText}>
                Sign Up
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17f196',
  },

  // Upper Section (60% of screen)
  upperSection: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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

  // Lower Section (40% of screen)
  lowerSection: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    position: 'relative',
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Text Styles
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '600',
    color: '#404040',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '400',
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  signInButton: {
    width: '100%',
    height: 56,
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
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  signUpButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
