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
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart, MessageCircle, Leaf, Mail } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const { t, currentLanguage } = useLanguage();
  



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

  const handleSkip = () => {
    console.log('🚀 Skip button clicked, navigating to final page');
    router.push('/(onboarding)/final');
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
        <View style={styles.onboardImageContainer}>
          <RNImage 
            source={require('@/assets/images/newImg/onboard_start.png')} 
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
              {currentLanguage.code === 'en' ? 'Welcome to Famora!' : 
               currentLanguage.code === 'de' ? 'Willkommen bei Famora!' : 
               currentLanguage.code === 'nl' ? 'Welkom bij Famora!' : 
               currentLanguage.code === 'fr' ? 'Bienvenue à Famora!' : 
               currentLanguage.code === 'es' ? '¡Bienvenido a Famora!' : 
               currentLanguage.code === 'it' ? 'Benvenuto in Famora!' : 
               t('onboarding.welcome.title') || 'Welcome to Famora!'}
            </Text>
          </View>
          
          <View>
            <Text style={styles.description}>
            {currentLanguage.code === 'en' ? 'Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!' : 
             currentLanguage.code === 'de' ? 'Treffen Sie kluge Entscheidungen! Setzen Sie klare Zeitpläne für Projekte und feiern Sie Ihre Erfolge!' : 
             currentLanguage.code === 'nl' ? 'Maak slimme beslissingen! Stel duidelijke tijdlijnen voor projecten en vier je prestaties!' : 
             currentLanguage.code === 'fr' ? 'Prenez des décisions intelligentes! Définissez des délais clairs pour les projets et célébrez vos réussites!' : 
             currentLanguage.code === 'es' ? '¡Toma decisiones inteligentes! Establece cronogramas claros para proyectos y celebra tus logros!' : 
             currentLanguage.code === 'it' ? 'Prendi decisioni intelligenti! Imposta tempistiche chiare per i progetti e celebra i tuoi successi!' : 
             t('onboarding.welcome.description') || 'Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!'}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.startButton}
              onPress={handleGetStarted}
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
            </Pressable>
            
            <Pressable 
              style={styles.skipButton}
              onPress={handleSkip}
            >
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
    justifyContent: 'flex-end',
  },

  // Upper Section (70% of screen)
  upperSection: {
    flex: 0.7,
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

  // Lower Section (35% of screen)
  lowerSection: {
    flex: 0.35,
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
    marginBottom: 0,
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 35,
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
    paddingBottom: 20,
  },
  startButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#17f196',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  skipButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
});