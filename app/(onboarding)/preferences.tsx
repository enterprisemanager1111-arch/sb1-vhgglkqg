import React, { useState } from 'react';
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
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Target, CircleHelp as HelpCircle } from 'lucide-react-native';
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

  const buttonScale = useSharedValue(1);

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
      router.push('/(onboarding)/auth');
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
      <StatusBar barStyle="light-content" backgroundColor="#102118" />

      {/* Upper Section with Background Image */}
      <View style={styles.upperSection}>
        <RNImage 
          source={require('@/assets/images/newImg/background.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Dark Translucent Overlay */}
        <View style={styles.darkOverlay} />
      </View>

      {/* Lower Section - White Card */}
      <View style={styles.lowerSection}>
        <View style={styles.contentCard}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {currentLanguage.code === 'en' ? 'Tell us you preferences' : 
               currentLanguage.code === 'de' ? 'Erzählen Sie uns Ihre Präferenzen' : 
               currentLanguage.code === 'nl' ? 'Vertel ons je voorkeuren' : 
               currentLanguage.code === 'fr' ? 'Parlez-nous de vos préférences' : 
               currentLanguage.code === 'es' ? 'Cuéntanos tus preferencias' : 
               currentLanguage.code === 'it' ? 'Parlaci delle tue preferenze' : 
               t('onboarding.preferences.title') || 'Tell us you preferences'}
            </Text>
            <Text style={styles.subtitle}>
              {currentLanguage.code === 'en' ? 'Let us shape Famora according to your wishes and thoughts.' : 
               currentLanguage.code === 'de' ? 'Lassen Sie uns Famora nach Ihren Wünschen und Gedanken gestalten.' : 
               currentLanguage.code === 'nl' ? 'Laat ons Famora vormgeven volgens jouw wensen en gedachten.' : 
               currentLanguage.code === 'fr' ? 'Laissez-nous façonner Famora selon vos souhaits et pensées.' : 
               currentLanguage.code === 'es' ? 'Dejanos dar forma a Famora según tus deseos y pensamientos.' : 
               currentLanguage.code === 'it' ? 'Lascia che modelliamo Famora secondo i tuoi desideri e pensieri.' : 
               t('onboarding.preferences.subtitle') || 'Let us shape Famora according to your wishes and thoughts.'}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDash, styles.activeDash]} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
          </View>

          {/* Goals Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={20} color="#17f196" strokeWidth={2} />
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
                <Pressable
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    goals.includes(goal.id) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal.id)}
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
                </Pressable>
              ))}
            </View>
          </View>

        </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
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
  upperSection: {
    height: 200,
    backgroundColor: '#102118',
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
    marginBottom: 32,
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedGoal: {
    borderColor: '#17f196',
    backgroundColor: 'rgba(23, 241, 150, 0.1)',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    marginBottom: 4,
  },
  selectedGoalLabel: {
    color: '#4A4A4A',
  },
  goalDescription: {
    fontSize: 13,
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: 17,
  },
  selectedGoalDescription: {
    color: '#666666',
  },

  // Action Buttons
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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