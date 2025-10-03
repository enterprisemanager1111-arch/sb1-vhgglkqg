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
import { ChevronLeft, ChevronRight, Flag, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';


export default function PreferencesSetup() {
  const { t, currentLanguage } = useLanguage();
  const [goals, setGoals] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const { onboardingData, updatePreferences, completeStep } = useOnboarding();
  const { showLoading, hideLoading } = useLoading();

  // Button animations

  const goalOptions = [
    { id: 'routine', label: t('onboarding.preferences.goals.routine.label') || 'Establish routines', description: t('onboarding.preferences.goals.routine.description') || 'Create regular processes' },
    { id: 'communication', label: t('onboarding.preferences.goals.communication.label') || 'Improve communication', description: t('onboarding.preferences.goals.communication.description') || 'Share all important information' },
    { id: 'organization', label: t('onboarding.preferences.goals.organization.label') || 'Better organized family', description: t('onboarding.preferences.goals.organization.description') || 'Appointments and tasks at a glance' },
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
            <View>
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
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
            <View style={styles.progressDash} />
            <View style={[styles.progressDash, styles.activeDash]} />
          </View>

          {/* Goals Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Flag size={20} color="#55ffb8" strokeWidth={2} />
              </View>
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
          <Pressable
            style={styles.continueButton}
            onPress={handleContinue}
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
          </Pressable>
          
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
    paddingTop: 40,
    marginTop: -30,
    position: 'relative',
  },
  contentCard: {
    flex: 1,
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
    fontFamily: 'Helvetica',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontStyle: 'Semi Bold',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#98a2b3',
    fontFamily: 'Helvetica',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: '130%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Helvetica',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica',
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
    borderColor: '#eaecf0',
    elevation: 1,
    alignItems: 'flex-start',
  },
  selectedGoal: {
    borderColor: '#59f6b5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#41ffb0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202020',
    fontFamily: 'Helvetica',
    textAlign: 'left',
    marginBottom: 4,
  },
  selectedGoalLabel: {
    color: '#303030',
    fontWeight: '750',
    fontFamily: 'Helvetica',
  },
  goalDescription: {
    fontSize: 13,
    color: '#aaaaaa',
    fontFamily: 'Helvetica',
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
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#17f196',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#17f196',
    fontFamily: 'Helvetica',
  },
  continueButton: {
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
  continueText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
});