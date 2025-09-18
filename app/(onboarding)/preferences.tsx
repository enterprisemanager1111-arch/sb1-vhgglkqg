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
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Target, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PreferencesSetup() {
  const { t, currentLanguage } = useLanguage();
  const [goals, setGoals] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const { onboardingData, updatePreferences, completeStep } = useOnboarding();

  const buttonScale = useSharedValue(1);

  const goalOptions = [
    { id: 'organization', labelKey: 'onboarding.preferences.goals.organization.label', icon: '📋', descriptionKey: 'onboarding.preferences.goals.organization.description' },
    { id: 'communication', labelKey: 'onboarding.preferences.goals.communication.label', icon: '💬', descriptionKey: 'onboarding.preferences.goals.communication.description' },
    { id: 'responsibility', labelKey: 'onboarding.preferences.goals.responsibility.label', icon: '🤝', descriptionKey: 'onboarding.preferences.goals.responsibility.description' },
    { id: 'memories', labelKey: 'onboarding.preferences.goals.memories.label', icon: '📸', descriptionKey: 'onboarding.preferences.goals.memories.description' },
    { id: 'routine', labelKey: 'onboarding.preferences.goals.routine.label', icon: '⏰', descriptionKey: 'onboarding.preferences.goals.routine.description' },
    { id: 'fun', labelKey: 'onboarding.preferences.goals.fun.label', icon: '🎉', descriptionKey: 'onboarding.preferences.goals.fun.description' },
  ];

  // Load existing data on mount
  React.useEffect(() => {
    const preferences = onboardingData.preferences;
    if (preferences.goals.length > 0) setGoals(preferences.goals);
  }, [onboardingData]);

  const handleContinue = async () => {
    try {
      // Save preferences to onboarding context
      await updatePreferences({
        goals: goals,
      });

      // Mark step as completed
      await completeStep('preferences', {
        goals: goals.join(', ')
      });

      router.push('/(onboarding)/auth');
    } catch (error) {
      console.error('Error saving preferences:', error);
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
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </Pressable>
        <Text style={styles.stepIndicator}>
          {currentLanguage.code === 'en' ? 'Step 3 of 5' : 
           currentLanguage.code === 'de' ? 'Schritt 3 von 5' : 
           currentLanguage.code === 'nl' ? 'Stap 3 van 5' : 
           currentLanguage.code === 'fr' ? 'Étape 3 sur 5' : 
           currentLanguage.code === 'es' ? 'Paso 3 de 5' : 
           currentLanguage.code === 'it' ? 'Passaggio 3 di 5' : 
           t('onboarding.stepIndicator', { current: '3', total: '5' }) || 'Step 3 of 5'}
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {currentLanguage.code === 'en' ? 'Your goals & preferences' : 
               currentLanguage.code === 'de' ? 'Ihre Ziele & Präferenzen' : 
               currentLanguage.code === 'nl' ? 'Je doelen & voorkeuren' : 
               currentLanguage.code === 'fr' ? 'Vos objectifs et préférences' : 
               currentLanguage.code === 'es' ? 'Tus objetivos y preferencias' : 
               currentLanguage.code === 'it' ? 'I tuoi obiettivi e preferenze' : 
               t('onboarding.preferences.title') || 'Your goals & preferences'}
            </Text>
            <Text style={styles.subtitle}>
              {currentLanguage.code === 'en' ? 'Let us shape Famora according to your wishes' : 
               currentLanguage.code === 'de' ? 'Lassen Sie uns Famora nach Ihren Wünschen gestalten' : 
               currentLanguage.code === 'nl' ? 'Laat ons Famora vormgeven volgens jouw wensen' : 
               currentLanguage.code === 'fr' ? 'Laissez-nous façonner Famora selon vos souhaits' : 
               currentLanguage.code === 'es' ? 'Dejanos dar forma a Famora según tus deseos' : 
               currentLanguage.code === 'it' ? 'Lascia che modelliamo Famora secondo i tuoi desideri' : 
               t('onboarding.preferences.subtitle') || 'Let us shape Famora according to your wishes'}
            </Text>
          </View>

          {/* Goals Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={20} color="#54FE54" strokeWidth={2} />
              <Text style={styles.sectionTitle}>
                {currentLanguage.code === 'en' ? 'What would you like to achieve?' : 
                 currentLanguage.code === 'de' ? 'Was möchten Sie erreichen?' : 
                 currentLanguage.code === 'nl' ? 'Wat wil je bereiken?' : 
                 currentLanguage.code === 'fr' ? 'Que souhaitez-vous accomplir?' : 
                 currentLanguage.code === 'es' ? '¿Qué te gustaría lograr?' : 
                 currentLanguage.code === 'it' ? 'Cosa vorresti ottenere?' : 
                 t('onboarding.preferences.goals.title') || 'What would you like to achieve?'}
              </Text>
              <Pressable 
                style={styles.tooltipButton}
                onPress={() => setShowTooltip(showTooltip === 'goals' ? null : 'goals')}
              >
                <HelpCircle size={16} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>
            {showTooltip === 'goals' && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  Basierend auf Ihren Zielen empfehlen wir passende Funktionen und Features.
                </Text>
              </View>
            )}
            <Text style={styles.sectionDescription}>
              {currentLanguage.code === 'en' ? 'Select up to 3 main goals for your family life' : 
               currentLanguage.code === 'de' ? 'Wählen Sie bis zu 3 Hauptziele für Ihr Familienleben' : 
               currentLanguage.code === 'nl' ? 'Selecteer maximaal 3 hoofddoelen voor je gezinsleven' : 
               currentLanguage.code === 'fr' ? 'Sélectionnez jusqu\'à 3 objectifs principaux pour votre vie de famille' : 
               currentLanguage.code === 'es' ? 'Selecciona hasta 3 objetivos principales para tu vida familiar' : 
               currentLanguage.code === 'it' ? 'Seleziona fino a 3 obiettivi principali per la tua vita familiare' : 
               t('onboarding.preferences.goals.subtitle') || 'Select up to 3 main goals for your family life'}
            </Text>
            <View style={styles.goalGrid}>
              {goalOptions.map((goal) => (
                <Pressable
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    goals.includes(goal.id) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  disabled={goals.length >= 3 && !goals.includes(goal.id)}
                >
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <Text style={[
                    styles.goalLabel,
                    goals.includes(goal.id) && styles.selectedGoalLabel
                  ]}>
                    {goal.id === 'organization' ? 
                      (currentLanguage.code === 'en' ? 'Better organize family' : 
                       currentLanguage.code === 'de' ? 'Familie besser organisieren' : 
                       currentLanguage.code === 'nl' ? 'Familie beter organiseren' : 
                       currentLanguage.code === 'fr' ? 'Mieux organiser la famille' : 
                       currentLanguage.code === 'es' ? 'Organizar mejor la familia' : 
                       currentLanguage.code === 'it' ? 'Organizzare meglio la famiglia' : 
                       t(goal.labelKey) || 'Better organize family') :
                     goal.id === 'communication' ? 
                      (currentLanguage.code === 'en' ? 'Improve communication' : 
                       currentLanguage.code === 'de' ? 'Kommunikation verbessern' : 
                       currentLanguage.code === 'nl' ? 'Communicatie verbeteren' : 
                       currentLanguage.code === 'fr' ? 'Améliorer la communication' : 
                       currentLanguage.code === 'es' ? 'Mejorar la comunicación' : 
                       currentLanguage.code === 'it' ? 'Migliorare la comunicazione' : 
                       t(goal.labelKey) || 'Improve communication') :
                     goal.id === 'responsibility' ? 
                      (currentLanguage.code === 'en' ? 'Share responsibility' : 
                       currentLanguage.code === 'de' ? 'Verantwortung teilen' : 
                       currentLanguage.code === 'nl' ? 'Verantwoordelijkheid delen' : 
                       currentLanguage.code === 'fr' ? 'Partager les responsabilités' : 
                       currentLanguage.code === 'es' ? 'Compartir responsabilidad' : 
                       currentLanguage.code === 'it' ? 'Condividere responsabilità' : 
                       t(goal.labelKey) || 'Share responsibility') :
                     goal.id === 'memories' ? 
                      (currentLanguage.code === 'en' ? 'Capture memories' : 
                       currentLanguage.code === 'de' ? 'Erinnerungen festhalten' : 
                       currentLanguage.code === 'nl' ? 'Herinneringen vastleggen' : 
                       currentLanguage.code === 'fr' ? 'Capturer des souvenirs' : 
                       currentLanguage.code === 'es' ? 'Capturar recuerdos' : 
                       currentLanguage.code === 'it' ? 'Catturare ricordi' : 
                       t(goal.labelKey) || 'Capture memories') :
                     goal.id === 'routine' ? 
                      (currentLanguage.code === 'en' ? 'Establish routines' : 
                       currentLanguage.code === 'de' ? 'Routinen etablieren' : 
                       currentLanguage.code === 'nl' ? 'Routines vaststellen' : 
                       currentLanguage.code === 'fr' ? 'Établir des routines' : 
                       currentLanguage.code === 'es' ? 'Establecer rutinas' : 
                       currentLanguage.code === 'it' ? 'Stabilire routine' : 
                       t(goal.labelKey) || 'Establish routines') :
                     goal.id === 'fun' ? 
                      (currentLanguage.code === 'en' ? 'Have more fun' : 
                       currentLanguage.code === 'de' ? 'Mehr Spaß haben' : 
                       currentLanguage.code === 'nl' ? 'Meer plezier hebben' : 
                       currentLanguage.code === 'fr' ? 'S\'amuser davantage' : 
                       currentLanguage.code === 'es' ? 'Divertirse más' : 
                       currentLanguage.code === 'it' ? 'Divertirsi di più' : 
                       t(goal.labelKey) || 'Have more fun') :
                     t(goal.labelKey)}
                  </Text>
                  <Text style={styles.goalDescription}>
                    {goal.id === 'organization' ? 
                      (currentLanguage.code === 'en' ? 'Appointments and tasks at a glance' : 
                       currentLanguage.code === 'de' ? 'Termine und Aufgaben im Überblick' : 
                       currentLanguage.code === 'nl' ? 'Afspraken en taken in één oogopslag' : 
                       currentLanguage.code === 'fr' ? 'Rendez-vous et tâches en un coup d\'œil' : 
                       currentLanguage.code === 'es' ? 'Citas y tareas de un vistazo' : 
                       currentLanguage.code === 'it' ? 'Appuntamenti e compiti a colpo d\'occhio' : 
                       t(goal.descriptionKey) || 'Appointments and tasks at a glance') :
                     goal.id === 'communication' ? 
                      (currentLanguage.code === 'en' ? 'Share all important information' : 
                       currentLanguage.code === 'de' ? 'Alle wichtigen Infos teilen' : 
                       currentLanguage.code === 'nl' ? 'Alle belangrijke info delen' : 
                       currentLanguage.code === 'fr' ? 'Partager toutes les informations importantes' : 
                       currentLanguage.code === 'es' ? 'Compartir toda la información importante' : 
                       currentLanguage.code === 'it' ? 'Condividere tutte le informazioni importanti' : 
                       t(goal.descriptionKey) || 'Share all important information') :
                     goal.id === 'responsibility' ? 
                      (currentLanguage.code === 'en' ? 'Distribute tasks fairly' : 
                       currentLanguage.code === 'de' ? 'Aufgaben fair verteilen' : 
                       currentLanguage.code === 'nl' ? 'Taken eerlijk verdelen' : 
                       currentLanguage.code === 'fr' ? 'Répartir les tâches équitablement' : 
                       currentLanguage.code === 'es' ? 'Distribuir tareas de manera justa' : 
                       currentLanguage.code === 'it' ? 'Distribuire i compiti equamente' : 
                       t(goal.descriptionKey) || 'Distribute tasks fairly') :
                     goal.id === 'memories' ? 
                      (currentLanguage.code === 'en' ? 'Collect special moments' : 
                       currentLanguage.code === 'de' ? 'Besondere Momente sammeln' : 
                       currentLanguage.code === 'nl' ? 'Speciale momenten verzamelen' : 
                       currentLanguage.code === 'fr' ? 'Collecter des moments spéciaux' : 
                       currentLanguage.code === 'es' ? 'Recopilar momentos especiales' : 
                       currentLanguage.code === 'it' ? 'Raccogliere momenti speciali' : 
                       t(goal.descriptionKey) || 'Collect special moments') :
                     goal.id === 'routine' ? 
                      (currentLanguage.code === 'en' ? 'Create regular processes' : 
                       currentLanguage.code === 'de' ? 'Regelmäßige Abläufe schaffen' : 
                       currentLanguage.code === 'nl' ? 'Regelmatige processen creëren' : 
                       currentLanguage.code === 'fr' ? 'Créer des processus réguliers' : 
                       currentLanguage.code === 'es' ? 'Crear procesos regulares' : 
                       currentLanguage.code === 'it' ? 'Creare processi regolari' : 
                       t(goal.descriptionKey) || 'Create regular processes') :
                     goal.id === 'fun' ? 
                      (currentLanguage.code === 'en' ? 'Plan shared activities' : 
                       currentLanguage.code === 'de' ? 'Gemeinsame Aktivitäten planen' : 
                       currentLanguage.code === 'nl' ? 'Gedeelde activiteiten plannen' : 
                       currentLanguage.code === 'fr' ? 'Planifier des activités partagées' : 
                       currentLanguage.code === 'es' ? 'Planificar actividades compartidas' : 
                       currentLanguage.code === 'it' ? 'Pianificare attività condivise' : 
                       t(goal.descriptionKey) || 'Plan shared activities') :
                     t(goal.descriptionKey)}
                  </Text>
                </Pressable>
              ))}
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
    fontFamily: 'Montserrat-Medium',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#54FE54',
    width: 24,
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
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
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },

  // Goals
  goalGrid: {
    gap: 16,
  },
  goalCard: {
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
  selectedGoal: {
    borderColor: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  selectedGoalLabel: {
    color: '#54FE54',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
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