import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
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
import { ChevronLeft, ChevronRight, Globe, Check } from 'lucide-react-native';
import { supportedLanguages, useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  
  // Button animations
  const nextButtonScale = useSharedValue(1);
  const backButtonScale = useSharedValue(1);
  
  // Individual language button animations
  const languageButtonScales = useSharedValue<Record<string, any>>({});
  const languageButtonRotations = useSharedValue<Record<string, any>>({});
  const languageButtonBounces = useSharedValue<Record<string, any>>({});
  
  // Staggered entrance animations for language buttons
  const languageButtonEntrances = useSharedValue<Record<string, any>>({});
  
  // Step interface animation
  const stepInterfaceScale = useSharedValue(1);
  const stepInterfaceOpacity = useSharedValue(1);
  
  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const progressOpacity = useSharedValue(0);
  const progressScale = useSharedValue(0.8);
  const questionOpacity = useSharedValue(0);
  const questionTranslateX = useSharedValue(-30);
  const languagesOpacity = useSharedValue(0);
  const languagesTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  
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

    // Progress indicator - scale in with bounce
    progressOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    progressScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 120 }));

    // Question - slide in from left
    questionOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    questionTranslateX.value = withDelay(600, withSpring(0, { damping: 10, stiffness: 100 }));

    // Languages - slide up with fade
    languagesOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    languagesTranslateY.value = withDelay(800, withSpring(0, { damping: 12, stiffness: 120 }));

    // Staggered language button entrance animations (right to left)
    const supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' }
    ];

    supportedLanguages.forEach((language, index) => {
      const delay = 0 + (index * 50); // Start immediately, stagger by 50ms (faster)
      languageButtonEntrances.value = {
        ...languageButtonEntrances.value,
        [language.code]: withDelay(delay, withSpring(0, { damping: 10, stiffness: 150 }))
      };
    });

    // Button - scale in with bounce
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(1000, withSpring(0, { damping: 8, stiffness: 120 }));

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

  // Initialize language button entrance positions
  useEffect(() => {
    const supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' }
    ];

    // Initialize all language buttons to start from right (100px)
    supportedLanguages.forEach((language) => {
      languageButtonEntrances.value = {
        ...languageButtonEntrances.value,
        [language.code]: 100
      };
    });
  }, []);

  // Trigger animations on component mount
  useEffect(() => {
    triggerAnimations();
  }, []);

  // Initialize with current language
  React.useEffect(() => {
    setSelectedLanguage(currentLanguage.code);
  }, [currentLanguage]);

  const handleContinue = async () => {
    // Animate step interface before navigation
    stepInterfaceScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(0.9, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    stepInterfaceOpacity.value = withSequence(
      withTiming(0.7, { duration: 150 }),
      withTiming(1, { duration: 300 })
    );

    showLoading(t('common.redirecting') || 'Redirecting...');
    
    try {
      // Language is already saved when selected - just navigate
      // Don't save any onboarding data to avoid overwriting personal info
      console.log('DEBUG: Language page - navigating to personal without saving onboarding data');
      hideLoading();
      router.push('/(onboarding)/personal');
    } catch (error) {
      console.error('Error navigating to personal page:', error);
      hideLoading();
      alert('Navigation error');
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Language button press handlers with fast cool sweet animations
  const handleLanguagePressIn = (languageCode: string) => {
    // Scale down with fast bounce
    languageButtonScales.value = {
      ...languageButtonScales.value,
      [languageCode]: withSpring(0.92, { damping: 8, stiffness: 200 })
    };
    
    // Add fast rotation effect
    languageButtonRotations.value = {
      ...languageButtonRotations.value,
      [languageCode]: withSpring(2, { damping: 10, stiffness: 150 })
    };
    
    // Add fast bounce effect
    languageButtonBounces.value = {
      ...languageButtonBounces.value,
      [languageCode]: withSequence(
        withTiming(1.05, { duration: 50 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    };
  };

  const handleLanguagePressOut = (languageCode: string) => {
    // Scale back up with fast spring
    languageButtonScales.value = {
      ...languageButtonScales.value,
      [languageCode]: withSpring(1, { damping: 10, stiffness: 150 })
    };
    
    // Reset rotation fast
    languageButtonRotations.value = {
      ...languageButtonRotations.value,
      [languageCode]: withSpring(0, { damping: 12, stiffness: 150 })
    };
    
    // Reset bounce fast
    languageButtonBounces.value = {
      ...languageButtonBounces.value,
      [languageCode]: withSpring(1, { damping: 10, stiffness: 150 })
    };
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

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
    transform: [{ scale: progressScale.value }],
  }));

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateX: questionTranslateX.value }],
  }));

  const languagesAnimatedStyle = useAnimatedStyle(() => ({
    opacity: languagesOpacity.value,
    transform: [{ translateY: languagesTranslateY.value }],
  }));

  const buttonContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Language button animated style with cool sweet animations
  const getLanguageButtonAnimatedStyle = (languageCode: string) => {
    return useAnimatedStyle(() => ({
      opacity: 1,
      transform: [
        { translateX: languageButtonEntrances.value[languageCode] || 100 }, // Start from right (100px)
        { scale: (languageButtonScales.value[languageCode] || 1) * (languageButtonBounces.value[languageCode] || 1) },
        { rotate: `${languageButtonRotations.value[languageCode] || 0}deg` }
      ],
    }), []);
  };

  // Additional animated styles
  const iconFloatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(iconFloat.value, [0, 1], [-3, 3], Extrapolate.CLAMP)
    }],
  }));

  const nextButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextButtonScale.value }],
  }));

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const stepInterfaceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepInterfaceOpacity.value,
    transform: [{ scale: stepInterfaceScale.value }],
  }));

  const handleNextPressIn = () => {
    nextButtonScale.value = withSpring(0.95);
  };

  const handleNextPressOut = () => {
    nextButtonScale.value = withSpring(1);
  };

  const handleBackPressIn = () => {
    backButtonScale.value = withSpring(0.95);
  };

  const handleBackPressOut = () => {
    backButtonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

      {/* Full Screen Background Image */}
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Upper Section */}
      <View style={styles.upperSection}>
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          {/* Title */}
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle as any]}>
            <Text style={styles.title}>Choose your Language</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={subtitleAnimatedStyle as any}>
            <Text style={styles.subtitle}>Select your preferred language for Famora, for the perfect experience.</Text>
          </Animated.View>

          {/* Progress Indicator */}
          <Animated.View style={[styles.progressContainer, progressAnimatedStyle as any, stepInterfaceAnimatedStyle as any]}>
            <View style={styles.progressDash} />
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
          </Animated.View>

          {/* Question */}
          <Animated.View style={[styles.questionContainer, questionAnimatedStyle as any]}>
            <Animated.View style={iconFloatAnimatedStyle as any}>
              <Globe size={20} color="#17f196" strokeWidth={2} />
            </Animated.View>
            <Text style={styles.questionText}>What language do you speak?</Text>
          </Animated.View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Language Options */}
              <View style={styles.languagesContainer}>
            {supportedLanguages.map((language) => (
              <AnimatedPressable
                key={language.code}
                style={[
                  styles.languageOption,
                  selectedLanguage === language.code && styles.selectedLanguageOption,
                  getLanguageButtonAnimatedStyle(language.code) as any
                ]}
                onPress={async () => {
                  setSelectedLanguage(language.code);
                  // Change language immediately for preview
                  if (language.code !== currentLanguage.code) {
                    await changeLanguage(language.code);
                  }
                }}
                onPressIn={() => handleLanguagePressIn(language.code)}
                onPressOut={() => handleLanguagePressOut(language.code)}
              >
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.selectedLanguageName
                ]}>
                  {language.nativeName}
                </Text>
                <Text style={[
                  styles.languageSubtitle,
                  selectedLanguage === language.code && styles.selectedLanguageSubtitle
                ]}>
                  {language.name}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

            </View>
          </ScrollView>

          {/* Button Container */}
          <Animated.View style={[styles.buttonContainer, buttonContainerAnimatedStyle as any]}>
            <AnimatedPressable
              style={[styles.nextButton, nextButtonAnimatedStyle as any]}
              onPress={handleContinue}
              onPressIn={handleNextPressIn}
              onPressOut={handleNextPressOut}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </AnimatedPressable>
            
            <AnimatedPressable
              style={[styles.backButton, backButtonAnimatedStyle as any]}
              onPress={handleBack}
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
            >
              <Text style={styles.backButtonText}>Back</Text>
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
    backgroundColor: '#102118',
  },

  // Upper Section (Solid Background)
  upperSection: {
    height: 200,
    backgroundColor: 'transparent',
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
    zIndex: -2,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#102118',
    opacity: 0.87,
    zIndex: 1,
  },

  // Lower Section (White Card)
  lowerSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
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
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDash: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eafff6',
  },
  activeDash: {
    backgroundColor: '#17f196',
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
    marginBottom: 8,
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
    fontSize: 30,
    fontWeight: '600',
    color: '#404040',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
    alignSelf: 'center',
  },

  // Languages
  languagesContainer: {
    gap: 12,
    marginBottom: 8,
  },
  languageOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 25,
    borderWidth: 2,
    borderColor: '#EfEfEf',
    elevation: 1,
    alignItems: 'flex-start',
  },
  selectedLanguageOption: {
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#202020',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'left',
    marginBottom: 4,
  },
  selectedLanguageName: {
    color: '#202020',
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'left',
    lineHeight: 18,
  },
  selectedLanguageSubtitle: {
    color: '#666666',
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
  },
  nextButton: {
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
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  backButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17f196',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 24,
  },
  questionIconContainer: {
    // No margin needed, using gap instead
  },
  questionText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
    color: '#202020',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});