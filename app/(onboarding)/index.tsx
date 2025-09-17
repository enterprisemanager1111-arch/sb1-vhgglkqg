import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const { t } = useLanguage();
  const buttonScale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  React.useEffect(() => {
    // Subtle icon breathing animation
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    // Gentle glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const handleGetStarted = async () => {
    // Clear any existing onboarding data to start fresh
    try {
      const { clearOnboardingData } = await import('@/contexts/OnboardingContext');
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

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />

      {/* Minimal Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      {/* Main Content - Centered */}
      <View style={styles.contentContainer}>
        {/* Hero Icon with Subtle Glow */}
        <View style={styles.heroSection}>
          <AnimatedView style={[styles.glowContainer, glowAnimatedStyle]}>
            <LinearGradient
              colors={['#54FE54', '#D1FE54']}
              start={{ x: 0.3, y: 0.2 }}
              end={{ x: 0.7, y: 0.8 }}
              style={styles.glow}
            />
          </AnimatedView>
          <AnimatedView style={[styles.iconWrapper, iconAnimatedStyle]}>
            <View style={styles.iconContainer}>
              <Heart size={28} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
            </View>
          </AnimatedView>
        </View>

        {/* Brand & Main Message */}
        <View style={styles.messageSection}>
          <Text style={styles.brandName}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.mainTitle}>{t('onboarding.welcome.subtitle')}</Text>
          <Text style={styles.subtitle}>
            {t('onboarding.welcome.description')}
          </Text>
        </View>

        {/* Simple Trust Signal */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>{t('onboarding.welcome.setup')}</Text>
        </View>
      </View>

      {/* Clean CTA */}
      <View style={styles.ctaContainer}>
        <AnimatedPressable
          style={[styles.startButton, buttonAnimatedStyle]}
          onPress={handleGetStarted}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={styles.startButtonText}>{t('onboarding.welcome.getStarted')}</Text>
          <ChevronRight size={20} color="#161618" strokeWidth={2.5} />
        </AnimatedPressable>
        
        <Text style={styles.footnote}>{t('onboarding.welcome.footnote')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  
  // Minimal Progress (Top)
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
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
    width: 20,
    borderRadius: 10,
  },

  // Main Content (Center)
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },

  // Hero Icon Section
  heroSection: {
    width: 120,
    height: 120,
    marginBottom: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  iconWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(20px)',
  },

  // Message Section
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#54FE54',
    marginBottom: 20,
    letterSpacing: 1,
  },
  mainTitle: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    color: '#161618',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#666666',
    maxWidth: 280,
  },

  // Trust Signal
  trustSection: {
    alignItems: 'center',
  },
  trustText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#54FE54',
    fontWeight: '500',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },

  // CTA Section (Bottom)
  ctaContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  startButton: {
    width: screenWidth - 64,
    height: 56,
    backgroundColor: '#54FE54',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    fontSize: 17,
    color: '#161618',
    letterSpacing: 0.3,
  },
  footnote: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});