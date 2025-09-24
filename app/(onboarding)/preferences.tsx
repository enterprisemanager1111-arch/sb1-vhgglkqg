import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
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
import { ChevronLeft, ChevronRight, Flag, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PreferencesSetup() {
  const { t, currentLanguage } = useLanguage();
  const [goals, setGoals] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const { onboardingData, updatePreferences, completeStep } = useOnboarding();
  const { showLoading, hideLoading } = useLoading();

  // Button animations
  const buttonScale = useSharedValue(1);
  const nextButtonScale = useSharedValue(1);
  const backButtonScale = useSharedValue(1);
  
  // Component animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const goalsOpacity = useSharedValue(0);
  const goalsTranslateY = useSharedValue(30);
  const progressOpacity = useSharedValue(0);
  const progressScale = useSharedValue(0.8);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  
  // Continuous animations
  const iconFloat = useSharedValue(0);
  const buttonPulse = useSharedValue(1);
  
  // Individual button animations for goals
  const goalButtonScales = useSharedValue<Record<string, any>>({});

  const goalOptions = [
    { id: 'routine', label: 'Establish routines', description: 'Create regular processes' },
    { id: 'communication', label: 'Improve communication', description: 'Share all important information' },
    { id: 'organization', label: 'Better organized family', description: 'Appointments and tasks at a glance' },
  ];

  // Load existing data on mount
  React.useEffect(() => {
    const preferences = onboardingData.preferences;
    if (preferences.goals.length > 0) setGoals(preferences.goals);
  }, [onboardingData]);

  const handleContinue = async () => {
    showLoading(t('common.saving') || 'Saving...');
    
    try {
      // Save preferences to onboarding context
      await updatePreferences({
        goals: goals,
      });

      // Mark step as completed
      await completeStep('preferences', {
        goals: goals.join(', ')
      });

      hideLoading();
      router.push('/(onboarding)/final');
    } catch (error) {
      console.error('Error saving preferences:', error);
      hideLoading();
      alert('Fehler beim Speichern der Präferenzen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Animation trigger function
  const triggerAnimations = () => {
    // Title animation - bounce in from top
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Subtitle animation - fade in with slight delay
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(200, withSpring(0, { damping: 12, stiffness: 120 }));

    // Goals section - slide up with fade
    goalsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    goalsTranslateY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 120 }));

    // Progress indicator - scale in with bounce
    progressOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    progressScale.value = withDelay(600, withSpring(1, { damping: 8, stiffness: 120 }));

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
  };

  // Trigger animations on component mount
  useEffect(() => {
    triggerAnimations();
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
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

  const goalsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: goalsOpacity.value,
    transform: [{ translateY: goalsTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
    transform: [{ scale: progressScale.value }],
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

  // Goal button animated style
  const getGoalButtonAnimatedStyle = (goalId: string) => {
    return useAnimatedStyle(() => ({
      transform: [{ 
        scale: goalButtonScales.value[goalId] || 1 
      }],
    }));
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Goal button handlers
  const handleGoalPressIn = (goalId: string) => {
    'worklet';
    goalButtonScales.value = {
      ...goalButtonScales.value,
      [goalId]: withSpring(0.95, { damping: 15, stiffness: 300 })
    };
  };

  const handleGoalPressOut = (goalId: string) => {
    'worklet';
    goalButtonScales.value = {
      ...goalButtonScales.value,
      [goalId]: withSpring(1, { damping: 15, stiffness: 300 })
    };
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
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.title}>
              {currentLanguage.code === 'en' ? 'Tell us you preferences' : 
               currentLanguage.code === 'de' ? 'Erzählen Sie uns Ihre Präferenzen' : 
               currentLanguage.code === 'nl' ? 'Vertel ons je voorkeuren' : 
               currentLanguage.code === 'fr' ? 'Parlez-nous de vos préférences' : 
               currentLanguage.code === 'es' ? 'Cuéntanos tus preferencias' : 
               currentLanguage.code === 'it' ? 'Parlaci delle tue preferenze' : 
               t('onboarding.preferences.title') || 'Tell us you preferences'}
            </Text>
            <Animated.View style={subtitleAnimatedStyle}>
              <Text style={styles.subtitle}>
              {currentLanguage.code === 'en' ? 'Let us shape Famora according to your wishes and thoughts.' : 
               currentLanguage.code === 'de' ? 'Lassen Sie uns Famora nach Ihren Wünschen und Gedanken gestalten.' : 
               currentLanguage.code === 'nl' ? 'Laat ons Famora vormgeven volgens jouw wensen en gedachten.' : 
               currentLanguage.code === 'fr' ? 'Laissez-nous façonner Famora selon vos souhaits et pensées.' : 
               currentLanguage.code === 'es' ? 'Dejanos dar forma a Famora según tus deseos y pensamientos.' : 
               currentLanguage.code === 'it' ? 'Lascia che modelliamo Famora secondo i tuoi desideri e pensieri.' : 
               t('onboarding.preferences.subtitle') || 'Let us shape Famora according to your wishes and thoughts.'}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Progress Indicator */}
          <Animated.View style={[styles.progressContainer, progressAnimatedStyle]}>
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
            <View style={[styles.progressDash, styles.activeDash]} />
          </Animated.View>

          {/* Goals Selection */}
          <Animated.View style={[styles.section, goalsAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Animated.View style={iconFloatAnimatedStyle}>
                <Flag size={20} color="#17f196" strokeWidth={2} />
              </Animated.View>
              <Text style={styles.sectionTitle}>
                {currentLanguage.code === 'en' ? 'What would you like to achieve?' : 
                 currentLanguage.code === 'de' ? 'Was möchten Sie erreichen?' : 
                 currentLanguage.code === 'nl' ? 'Wat wil je bereiken?' : 
                 currentLanguage.code === 'fr' ? 'Que souhaitez-vous accomplir?' : 
                 currentLanguage.code === 'es' ? '¿Qué te gustaría lograr?' : 
                 currentLanguage.code === 'it' ? 'Cosa vorresti ottenere?' : 
                 t('onboarding.preferences.goals.title') || 'What would you like to achieve?'}
              </Text>
            </View>
            <View style={styles.goalGrid}>
              {goalOptions.map((goal) => (
                <AnimatedPressable
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    goals.includes(goal.id) && styles.selectedGoal,
                    getGoalButtonAnimatedStyle(goal.id)
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  onPressIn={() => handleGoalPressIn(goal.id)}
                  onPressOut={() => handleGoalPressOut(goal.id)}
                >
                  <Text style={[
                    styles.goalLabel,
                    goals.includes(goal.id) && styles.selectedGoalLabel
                  ]}>
                    {goal.label}
                  </Text>
                  <Text style={[
                    styles.goalDescription,
                    goals.includes(goal.id) && styles.selectedGoalDescription
                  ]}>
                    {goal.description}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </Animated.View>

        </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
          <AnimatedPressable
            style={[styles.continueButton, buttonAnimatedStyle]}
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.continueText}>
              {currentLanguage.code === 'en' ? 'Next' : 
               currentLanguage.code === 'de' ? 'Weiter' : 
               currentLanguage.code === 'nl' ? 'Volgende' : 
               currentLanguage.code === 'fr' ? 'Suivant' : 
               currentLanguage.code === 'es' ? 'Siguiente' : 
               currentLanguage.code === 'it' ? 'Avanti' : 
               t('common.next') || 'Next'}
            </Text>
          </AnimatedPressable>
          
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>
              {currentLanguage.code === 'en' ? 'Back' : 
               currentLanguage.code === 'de' ? 'Zurück' : 
               currentLanguage.code === 'nl' ? 'Terug' : 
               currentLanguage.code === 'fr' ? 'Retour' : 
               currentLanguage.code === 'es' ? 'Atrás' : 
               currentLanguage.code === 'it' ? 'Indietro' : 
               t('common.back') || 'Back'}
            </Text>
            </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102118',
  },
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
  lowerSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    position: 'relative',
  },
  contentCard: {
    flex: 1,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
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
    backgroundColor: '#55ffb8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 8,
    alignItems: 'center',
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
    fontWeight: '450',
    textAlign: 'center',
    lineHeight: 17,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    marginBottom: 20,
    lineHeight: 20,
  },
  tooltipButton: {
    padding: 4,
  },
  tooltip: {
    backgroundColor: '#161618',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tooltipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 18,
  },

  // Goals
  goalGrid: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 25,
    borderWidth: 2,
    borderColor: '#EfEfEf',
    elevation: 1,
    alignItems: 'left',
  },
  selectedGoal: {
    borderColor: '#17f196',
    backgroundColor: '#FFFFFF',
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202020',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    textAlign: 'left',
    marginBottom: 4,
  },
  selectedGoalLabel: {
    color: '#303030',
    fontWeight: '750',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  goalDescription: {
    fontSize: 13,
    color: '#aaaaaa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 17,
  },
  selectedGoalDescription: {
    color: '#888888',
  },

  // Action Buttons
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
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
  continueButton: {
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
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});