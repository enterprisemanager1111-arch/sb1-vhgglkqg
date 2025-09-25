import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Heart, Sparkles } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CoolLoadingScreenProps {
  message?: string;
}

export default function CoolLoadingScreen({ message = "Loading Famora..." }: CoolLoadingScreenProps) {
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(0);
  const gradientRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Logo entrance animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 600 }),
      withTiming(1, { duration: 200 })
    );

    // Logo rotation animation
    logoRotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );

    // Sparkle animations
    sparkleScale.value = withDelay(400, withTiming(1, { duration: 500 }));
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1,
      false
    );

    // Text animation
    textOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));

    // Heart animation
    heartOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Gradient rotation
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false
    );

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleScale.value,
    transform: [
      { scale: sparkleScale.value },
      { rotate: `${sparkleRotation.value}deg` }
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}deg` }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <Animated.View style={[styles.gradientContainer, gradientAnimatedStyle]}>
        <LinearGradient
          colors={['#17f196', '#00d4aa', '#00a085', '#17f196']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Floating sparkles */}
      <Animated.View style={[styles.sparkle1, sparkleAnimatedStyle]}>
        <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" />
      </Animated.View>
      <Animated.View style={[styles.sparkle2, sparkleAnimatedStyle]}>
        <Sparkles size={16} color="#FFFFFF" fill="#FFFFFF" />
      </Animated.View>
      <Animated.View style={[styles.sparkle3, sparkleAnimatedStyle]}>
        <Sparkles size={24} color="#FFFFFF" fill="#FFFFFF" />
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container with pulse effect */}
        <Animated.View style={[styles.logoContainer, pulseAnimatedStyle]}>
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <Image 
              source={require('@/assets/images/newImg/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            {/* Zap icon overlay */}
            <View style={styles.zapOverlay}>
              <Zap size={32} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </Animated.View>
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[styles.appName, textAnimatedStyle]}>
          Famora
        </Animated.Text>

        {/* Loading message */}
        <Animated.Text style={[styles.loadingMessage, textAnimatedStyle]}>
          {message}
        </Animated.Text>

        {/* Heart animation */}
        <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
          <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
        </Animated.View>

        {/* Loading dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { animationDelay: 0 }]} />
          <Animated.View style={[styles.dot, { animationDelay: 200 }]} />
          <Animated.View style={[styles.dot, { animationDelay: 400 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00a085',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth * 1.5,
    height: screenHeight * 1.5,
    marginLeft: -screenWidth * 0.25,
    marginTop: -screenHeight * 0.25,
  },
  gradient: {
    flex: 1,
    borderRadius: screenWidth * 0.75,
  },
  sparkle1: {
    position: 'absolute',
    top: '20%',
    left: '15%',
  },
  sparkle2: {
    position: 'absolute',
    top: '30%',
    right: '20%',
  },
  sparkle3: {
    position: 'absolute',
    bottom: '25%',
    left: '25%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  zapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    backgroundColor: 'rgba(0, 160, 133, 0.3)',
    borderRadius: 20,
    padding: 4,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500',
  },
  heartContainer: {
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
});
