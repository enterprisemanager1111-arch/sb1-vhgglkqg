import React, { useState, useEffect } from 'react';
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
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart, MessageCircle, Leaf, Mail } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const { t, currentLanguage } = useLanguage();
  
  // Button animations
  const buttonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);
  
  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const illustrationOpacity = useSharedValue(0);
  const illustrationScale = useSharedValue(0.8);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  
  // Continuous animations
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
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

    // Features - slide up with fade
    featuresOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    featuresTranslateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 120 }));

    // Buttons - fade in from bottom
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(800, withSpring(0, { damping: 10, stiffness: 100 }));

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

    // Existing continuous animations
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  };

  // Trigger animations on component mount
  useEffect(() => {
    triggerAnimations();
  }, []);

  const handleGetStarted = async () => {
    // Clear any existing onboarding data to start fresh
    try {
      // Note: We can't use the hook here, so we'll clear directly in AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem('@famora_onboarding_data');
      console.log('DEBUG: Cleared onboarding data for fresh start');
    } catch (error) {
      console.log('DEBUG: Error clearing onboarding data:', error);
    }
    
    router.push('/(onboarding)/language');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

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

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
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

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

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

        {/* Onboard Start Image */}
        <Animated.View style={[styles.onboardImageContainer, illustrationAnimatedStyle]}>
          <RNImage 
            source={require('@/assets/images/newImg/onboard_start.png')} 
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
              {currentLanguage.code === 'en' ? 'Welcome to Famora!' : 
               currentLanguage.code === 'de' ? 'Willkommen bei Famora!' : 
               currentLanguage.code === 'nl' ? 'Welkom bij Famora!' : 
               currentLanguage.code === 'fr' ? 'Bienvenue à Famora!' : 
               currentLanguage.code === 'es' ? '¡Bienvenido a Famora!' : 
               currentLanguage.code === 'it' ? 'Benvenuto in Famora!' : 
               t('onboarding.welcome.title') || 'Welcome to Famora!'}
            </Text>
          </Animated.View>
          
          <Animated.View style={subtitleAnimatedStyle}>
            <Text style={styles.description}>
            {currentLanguage.code === 'en' ? 'Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!' : 
             currentLanguage.code === 'de' ? 'Treffen Sie kluge Entscheidungen! Setzen Sie klare Zeitpläne für Projekte und feiern Sie Ihre Erfolge!' : 
             currentLanguage.code === 'nl' ? 'Maak slimme beslissingen! Stel duidelijke tijdlijnen voor projecten en vier je prestaties!' : 
             currentLanguage.code === 'fr' ? 'Prenez des décisions intelligentes! Définissez des délais clairs pour les projets et célébrez vos réussites!' : 
             currentLanguage.code === 'es' ? '¡Toma decisiones inteligentes! Establece cronogramas claros para proyectos y celebra tus logros!' : 
             currentLanguage.code === 'it' ? 'Prendi decisioni intelligenti! Imposta tempistiche chiare per i progetti e celebra i tuoi successi!' : 
             t('onboarding.welcome.description') || 'Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!'}
            </Text>
          </Animated.View>

          {/* Progress Indicator */}
          <Animated.View style={[styles.progressContainer, featuresAnimatedStyle]}>
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
            <AnimatedPressable
              style={[styles.startButton, buttonAnimatedStyle]}
              onPress={handleGetStarted}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={styles.startButtonText}>
                {currentLanguage.code === 'en' ? 'Start' : 
                 currentLanguage.code === 'de' ? 'Start' : 
                 currentLanguage.code === 'nl' ? 'Start' : 
                 currentLanguage.code === 'fr' ? 'Commencer' : 
                 currentLanguage.code === 'es' ? 'Empezar' : 
                 currentLanguage.code === 'it' ? 'Inizia' : 
                 t('onboarding.welcome.start') || 'Start'}
              </Text>
            </AnimatedPressable>
            
            <Pressable style={styles.skipButton}>
              <Text style={styles.skipButtonText}>
                {currentLanguage.code === 'en' ? 'Skip' : 
                 currentLanguage.code === 'de' ? 'Überspringen' : 
                 currentLanguage.code === 'nl' ? 'Overslaan' : 
                 currentLanguage.code === 'fr' ? 'Ignorer' : 
                 currentLanguage.code === 'es' ? 'Omitir' : 
                 currentLanguage.code === 'it' ? 'Salta' : 
                 t('onboarding.welcome.skip') || 'Skip'}
              </Text>
            </Pressable>
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

  // Onboard Start Image
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

  // Central Illustration
  illustrationContainer: {
    width: 300,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Dark Gray Blob
  darkBlob: {
    width: 200,
    height: 140,
    backgroundColor: '#4A4A4A',
    borderRadius: 100,
    position: 'absolute',
    top: 10,
    left: 50,
  },

  // Smartphone
  smartphone: {
    width: 50,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    position: 'absolute',
    top: 40,
    left: 125,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  personHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A4A4A',
    marginBottom: 1,
  },
  personBody: {
    width: 12,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
  },
  personShirt: {
    width: 12,
    height: 8,
    backgroundColor: '#D0D0D0',
    borderRadius: 1,
    position: 'absolute',
    top: 2,
  },
  personPants: {
    width: 12,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    position: 'absolute',
    bottom: 0,
  },

  // Chat Bubbles
  chatBubble: {
    position: 'absolute',
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainChatBubble: {
    width: 40,
    height: 30,
    right: 20,
    top: 60,
    backgroundColor: '#17f196',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubble1: {
    width: 20,
    height: 16,
    backgroundColor: '#4A4A4A',
    top: 20,
    right: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubble2: {
    width: 16,
    height: 12,
    backgroundColor: '#4A4A4A',
    top: 80,
    left: 20,
  },
  chatBubble3: {
    width: 18,
    height: 14,
    backgroundColor: '#4A4A4A',
    bottom: 40,
    right: 30,
  },
  textLine: {
    width: 20,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginVertical: 1,
    borderRadius: 1,
  },
  ellipsis: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Envelope
  envelopeContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    right: 15,
    top: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Hearts
  heartContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heart1: {
    top: 100,
    right: 60,
  },
  heart2: {
    bottom: 50,
    left: 30,
  },

  // Plant Elements
  plantContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  plant1: {
    bottom: 20,
    left: 50,
  },
  plant2: {
    bottom: 30,
    left: 70,
  },

  // Lower Section (40% of screen)
  lowerSection: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  contentCard: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Text Styles
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '600',
    color: '#404040',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  description: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '450',
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eafff6',
  },
  activeDash: {
    backgroundColor: '#55ffb8',
  },

  // Buttons
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
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
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  skipButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});