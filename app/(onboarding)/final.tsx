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
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingFinal() {
  const { t, currentLanguage } = useLanguage();
  
  // Button animations
  const signInButtonScale = useSharedValue(1);
  const signUpButtonScale = useSharedValue(1);
  
  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const illustrationOpacity = useSharedValue(0);
  const illustrationScale = useSharedValue(0.8);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  
  // Continuous animations
  const iconFloat = useSharedValue(0);
  const buttonPulse = useSharedValue(1);
  
  // Animation trigger function
  const triggerAnimations = () => {
    // Title animation - bounce in from top
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Subtitle animation - fade in with slight delay
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));

    // Illustration - scale in with bounce
    illustrationOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    illustrationScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 120 }));

    // Buttons - fade in from bottom
    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Icon floating animation - continuous gentle float
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );

    // Button pulse animation - subtle pulse effect
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  };

  // Trigger animations on component mount
  useEffect(() => {
    triggerAnimations();
  }, []);


  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  // Individual button handlers
  const handleSignInPressIn = () => {
    signInButtonScale.value = withSpring(0.95);
  };

  const handleSignInPressOut = () => {
    signInButtonScale.value = withSpring(1);
  };

  const handleSignUpPressIn = () => {
    signUpButtonScale.value = withSpring(0.95);
  };

  const handleSignUpPressOut = () => {
    signUpButtonScale.value = withSpring(1);
  };

  // Component animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const illustrationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: illustrationOpacity.value,
    transform: [{ scale: illustrationScale.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  // Additional cool animated styles
  const iconFloatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(iconFloat.value, [0, 1], [-3, 3], Extrapolate.CLAMP)
    }],
  }));

  const buttonPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  // Individual button animated styles
  const signInButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signInButtonScale.value }],
  }));

  const signUpButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signUpButtonScale.value }],
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
        <Animated.View style={[styles.onboardImageContainer, illustrationAnimatedStyle]}>
          <RNImage 
            source={require('@/assets/images/newImg/onboard_final.png')} 
            style={styles.onboardImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          <Animated.View style={titleAnimatedStyle}>
            <Text style={styles.welcomeTitle}>
              Your Famora Account
            </Text>
          </Animated.View>
          
          <Animated.View style={subtitleAnimatedStyle}>
            <Text style={styles.description}>
              Create or log in to your account to experience all the features.
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
            {/* Sign In Button */}
            <AnimatedPressable
              style={[styles.signInButton, signInButtonAnimatedStyle]}
              onPress={() => {
                router.push('/(onboarding)/signin');
              }}
              onPressIn={handleSignInPressIn}
              onPressOut={handleSignInPressOut}
            >
              <Text style={styles.signInButtonText}>
                Sign In
              </Text>
            </AnimatedPressable>

            {/* Sign Up Button */}
            <AnimatedPressable
              style={[styles.signUpButton, signUpButtonAnimatedStyle]}
              onPress={() => {
                // Navigate to sign up page
                router.push('/(onboarding)/signup');
              }}
              onPressIn={handleSignUpPressIn}
              onPressOut={handleSignUpPressOut}
            >
              <Text style={styles.signUpButtonText}>
                Sign Up
              </Text>
            </AnimatedPressable>
          </Animated.View>
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
