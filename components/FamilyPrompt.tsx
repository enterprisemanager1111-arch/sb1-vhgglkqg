import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Users, Plus, Hash } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FamilyPrompt() {
  const { t } = useLanguage();
  const createButtonScale = useSharedValue(1);
  const joinButtonScale = useSharedValue(1);

  const createButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createButtonScale.value }],
  }));

  const joinButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: joinButtonScale.value }],
  }));

  const handleCreatePressIn = () => {
    createButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handleCreatePressOut = () => {
    createButtonScale.value = withSpring(1, { damping: 20, stiffness: 150 });
  };

  const handleJoinPressIn = () => {
    joinButtonScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handleJoinPressOut = () => {
    joinButtonScale.value = withSpring(1, { damping: 20, stiffness: 150 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Users size={48} color="#54FE54" strokeWidth={2} />
      </View>
      
      <Text style={styles.title}>{t('familyPrompt.title')}</Text>
      <Text style={styles.description}>
        {t('familyPrompt.description')}
      </Text>
      
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          style={[styles.button, styles.createButton, createButtonAnimatedStyle]}
          onPress={() => router.push('/(onboarding)/family')}
          onPressIn={handleCreatePressIn}
          onPressOut={handleCreatePressOut}
        >
          <Plus size={20} color="#161618" strokeWidth={2} />
          <Text style={styles.buttonText}>{t('familyPrompt.createFamily')}</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, styles.joinButton, joinButtonAnimatedStyle]}
          onPress={() => router.push('/(onboarding)/family')}
          onPressIn={handleJoinPressIn}
          onPressOut={handleJoinPressOut}
        >
          <Hash size={20} color="#666666" strokeWidth={2} />
          <Text style={[styles.buttonText, styles.joinButtonText]}>{t('familyPrompt.joinFamily')}</Text>
        </AnimatedPressable>
      </View>
      
      <Pressable 
        style={styles.skipButton}
        onPress={() => {/* Kann später implementiert werden */}}
      >
        <Text style={styles.skipText}>{t('familyPrompt.setupLater')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 64,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButton: {
    backgroundColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  joinButtonText: {
    color: '#666666',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#999999',
  },
});