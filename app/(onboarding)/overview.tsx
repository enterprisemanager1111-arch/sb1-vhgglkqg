import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ChevronLeft, RotateCcw, Check } from 'lucide-react-native';
import OnboardingOverview, { OnboardingStep } from '@/components/OnboardingOverview';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingOverviewScreen() {
  const { getOnboardingSteps, getCompletionPercentage, clearOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  
  const backButtonScale = useSharedValue(1);
  const resetButtonScale = useSharedValue(1);
  
  const steps = getOnboardingSteps();
  const completionPercentage = getCompletionPercentage();
  const isCompleted = completionPercentage === 100;

  const handleStepPress = (step: OnboardingStep) => {
    // Navigate to specific onboarding step for editing/viewing
    switch (step.id) {
      case 'personal-info':
        router.push('/(onboarding)/personal');
        break;
      case 'preferences':
        router.push('/(onboarding)/preferences');
        break;
      case 'authentication':
        router.push('/(onboarding)/auth');
        break;
      case 'profile-picture':
        router.push('/(onboarding)/profile');
        break;
      case 'family-setup':
        router.push('/(onboarding)/family');
        break;
      default:
        console.log('Unknown step:', step.id);
    }
  };

  const handleEditStep = (step: OnboardingStep) => {
    // Same as handleStepPress for now, could be different editing flow
    handleStepPress(step);
  };

  const handleResetOnboarding = async () => {
    setRefreshing(true);
    try {
      await clearOnboardingData();
      router.replace('/(onboarding)');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));

  const resetButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resetButtonScale.value }],
  }));

  const handleBackPressIn = () => {
    backButtonScale.value = withSpring(0.95);
  };

  const handleBackPressOut = () => {
    backButtonScale.value = withSpring(1);
  };

  const handleResetPressIn = () => {
    resetButtonScale.value = withSpring(0.95);
  };

  const handleResetPressOut = () => {
    resetButtonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          style={[styles.headerButton, backButtonAnimatedStyle]}
          onPress={handleBack}
          onPressIn={handleBackPressIn}
          onPressOut={handleBackPressOut}
        >
          <ChevronLeft size={24} color="#161618" strokeWidth={2} />
        </AnimatedPressable>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('onboarding.overview.title')}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Check size={14} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.completedBadgeText}>{t('onboarding.overview.completed')}</Text>
            </View>
          )}
        </View>

        <AnimatedPressable
          style={[styles.headerButton, resetButtonAnimatedStyle]}
          onPress={handleResetOnboarding}
          onPressIn={handleResetPressIn}
          onPressOut={handleResetPressOut}
          disabled={refreshing}
        >
          <RotateCcw size={20} color="#666666" strokeWidth={2} />
        </AnimatedPressable>
      </View>

      {/* Onboarding Overview Component */}
      <OnboardingOverview
        steps={steps}
        onStepPress={handleStepPress}
        onEditStep={handleEditStep}
        showProgress={true}
      />
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
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
});