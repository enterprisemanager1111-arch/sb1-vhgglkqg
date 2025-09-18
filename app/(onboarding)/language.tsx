import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Globe, Check } from 'lucide-react-native';
import { supportedLanguages, useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { currentLanguage, changeLanguage, t } = useLanguage();
  
  const buttonScale = useSharedValue(1);

  // Initialize with current language
  React.useEffect(() => {
    setSelectedLanguage(currentLanguage.code);
  }, [currentLanguage]);

  const handleContinue = async () => {
    try {
      // Language is already saved when selected - just navigate
      // Don't save any onboarding data to avoid overwriting personal info
      console.log('DEBUG: Language page - navigating to personal without saving onboarding data');
      router.push('/(onboarding)/personal');
    } catch (error) {
      console.error('Error navigating to personal page:', error);
      alert('Navigation error');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>
          {currentLanguage.code === 'en' ? 'Step 1 of 5' : 
           currentLanguage.code === 'de' ? 'Schritt 1 von 5' : 
           currentLanguage.code === 'nl' ? 'Stap 1 van 5' : 
           currentLanguage.code === 'fr' ? 'Étape 1 sur 5' : 
           currentLanguage.code === 'es' ? 'Paso 1 de 5' : 
           currentLanguage.code === 'it' ? 'Passaggio 1 di 5' : 
           t('onboarding.stepIndicator', { current: '1', total: '5' }) || 'Step 1 of 5'}
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <View style={styles.iconContainer}>
              <Globe size={32} color="#54FE54" strokeWidth={2} />
            </View>
            <Text style={styles.title}>
              {currentLanguage.code === 'en' ? 'Choose your language' : 
               currentLanguage.code === 'de' ? 'Wählen Sie Ihre Sprache' : 
               currentLanguage.code === 'nl' ? 'Kies je taal' : 
               currentLanguage.code === 'fr' ? 'Choisissez votre langue' : 
               currentLanguage.code === 'es' ? 'Elige tu idioma' : 
               currentLanguage.code === 'it' ? 'Scegli la tua lingua' : 
               t('onboarding.language.title') || 'Choose your language'}
            </Text>
            <Text style={styles.subtitle}>
              {currentLanguage.code === 'en' ? 'Select your preferred language for Famora' : 
               currentLanguage.code === 'de' ? 'Wählen Sie Ihre bevorzugte Sprache für Famora' : 
               currentLanguage.code === 'nl' ? 'Selecteer je voorkeurstaal voor Famora' : 
               currentLanguage.code === 'fr' ? 'Sélectionnez votre langue préférée pour Famora' : 
               currentLanguage.code === 'es' ? 'Selecciona tu idioma preferido para Famora' : 
               currentLanguage.code === 'it' ? 'Seleziona la tua lingua preferita per Famora' : 
               t('onboarding.language.subtitle') || 'Select your preferred language for Famora'}
            </Text>
          </View>

          {/* Language Options */}
          <View style={styles.languagesContainer}>
            {supportedLanguages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.selectedLanguageOption
                ]}
                onPress={async () => {
                  setSelectedLanguage(language.code);
                  // Change language immediately for preview
                  if (language.code !== currentLanguage.code) {
                    await changeLanguage(language.code);
                  }
                }}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      selectedLanguage === language.code && styles.selectedLanguageName
                    ]}>
                      {language.nativeName}
                    </Text>
                    <Text style={styles.languageSubtitle}>
                      {language.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.languageRight}>
                  {selectedLanguage === language.code && (
                    <View style={styles.checkContainer}>
                      <Check size={18} color="#54FE54" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Language Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>
              {currentLanguage.code === 'en' ? 'Preview:' : 
               currentLanguage.code === 'de' ? 'Vorschau:' : 
               currentLanguage.code === 'nl' ? 'Voorbeeld:' : 
               currentLanguage.code === 'fr' ? 'Aperçu:' : 
               currentLanguage.code === 'es' ? 'Vista previa:' : 
               currentLanguage.code === 'it' ? 'Anteprima:' : 
               'Preview:'}
            </Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewText}>
                {selectedLanguage === 'en' ? 'Welcome to Famora' : 
                 selectedLanguage === 'de' ? 'Willkommen bei Famora' : 
                 selectedLanguage === 'nl' ? 'Welkom bij Famora' : 
                 selectedLanguage === 'fr' ? 'Bienvenue à Famora' : 
                 selectedLanguage === 'es' ? 'Bienvenido a Famora' : 
                 selectedLanguage === 'it' ? 'Benvenuto in Famora' : 
                 'Welcome to Famora'}
              </Text>
              <Text style={styles.previewSubtext}>
                {selectedLanguage === 'en' ? 'Your digital family organizer' : 
                 selectedLanguage === 'de' ? 'Ihr digitaler Familienorganisator' : 
                 selectedLanguage === 'nl' ? 'Je digitale familie-organizer' : 
                 selectedLanguage === 'fr' ? 'Votre organisateur familial numérique' : 
                 selectedLanguage === 'es' ? 'Tu organizador familiar digital' : 
                 selectedLanguage === 'it' ? 'Il tuo organizzatore familiare digitale' : 
                 'Your digital family organizer'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <AnimatedPressable
          style={[styles.continueButton, buttonAnimatedStyle]}
          onPress={handleContinue}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.continueText}>
            {currentLanguage.code === 'en' ? 'Continue' : 
             currentLanguage.code === 'de' ? 'Weiter' : 
             currentLanguage.code === 'nl' ? 'Doorgaan' : 
             currentLanguage.code === 'fr' ? 'Continuer' : 
             currentLanguage.code === 'es' ? 'Continuar' : 
             currentLanguage.code === 'it' ? 'Continua' : 
             t('common.continue') || 'Continue'}
          </Text>
          <ChevronRight size={20} color="#161618" strokeWidth={2} />
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#54FE54',
    width: 24,
    borderRadius: 12,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  
  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Languages
  languagesContainer: {
    gap: 12,
    marginBottom: 32,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedLanguageOption: {
    borderColor: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: '#54FE54',
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  languageRight: {
    alignItems: 'center',
    width: 32,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Preview Section
  previewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F3F3F5',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
});