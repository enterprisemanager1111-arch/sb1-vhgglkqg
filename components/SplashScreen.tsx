import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const fadeOpacity = useSharedValue(1);
  const glowScale = useSharedValue(0.8);
  const iconScale = useSharedValue(0.7);
  const iconOpacity = useSharedValue(0);

  const startAnimations = useCallback(() => {
    // 1. Icon scale-in animation
    iconOpacity.value = withTiming(1, { duration: 800 });
    iconScale.value = withTiming(1, { duration: 1000 });

    // 2. Glow pulse animation (repeating)
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(1.2, { duration: 1000 })
      ),
      3, // Limited repeats instead of infinite
      true
    );

    // 3. Fade out after 2.5 seconds
    const timer = setTimeout(() => {
      fadeOpacity.value = withTiming(0, { duration: 800 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 2000); // Reduced from 2800ms to 2000ms
    
    // Cleanup timer
    return () => clearTimeout(timer);
  }, [iconOpacity, iconScale, glowScale, fadeOpacity, onFinish]);

  useEffect(() => {
    // Start animations sequence
    startAnimations();
  }, [startAnimations]);

  // Animated styles
  const splashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View style={[styles.splash, splashAnimatedStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F5" />
      
      {/* Glow Effect Background */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <LinearGradient
          colors={['#54FE54', '#D1FE54']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.7, y: 0.8 }}
          style={styles.glow}
        />
      </Animated.View>

      {/* Main Logo Circle */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#54FE54', '#D1FE54']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.7, y: 0.8 }}
          style={styles.logoCircle}
        >
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <View style={styles.iconPlaceholder}>
              <View style={styles.iconShape} />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Outer Glow Ring */}
      <View style={styles.outerRing} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Main splash container - full screen
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  // Animated glow effect container
  glowContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Blurred glow effect
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.6,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },

  // Logo container
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  // Main logo circle with gradient
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  // Icon container
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Icon placeholder (simple geometric shape)
  iconPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconShape: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Subtle outer ring effect
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    zIndex: 1,
  },
});