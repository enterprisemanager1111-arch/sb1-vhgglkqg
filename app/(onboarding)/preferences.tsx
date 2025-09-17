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
  const { t } = useLanguage();
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
        <Text style={styles.stepIndicator}>{t('onboarding.stepIndicator', { current: '3', total: '5' })}</Text>
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
            <Text style={styles.title}>{t('onboarding.preferences.title')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.preferences.subtitle')}
            </Text>
          </View>

          {/* Goals Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={20} color="#54FE54" strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('onboarding.preferences.goals.title')}</Text>
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
                  {t('onboarding.preferences.goals.subtitle')}
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
                    {t(goal.labelKey)}
                  </Text>
                  <Text style={styles.goalDescription}>
                    {t(goal.descriptionKey)}
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
          <Text style={styles.continueText}>Continue</Text>
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