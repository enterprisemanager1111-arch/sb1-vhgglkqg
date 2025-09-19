import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';

// Floating Animation Component
interface FloatingAnimationProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
  delay?: number;
}

export function FloatingAnimation({ 
  children, 
  intensity = 10, 
  duration = 3000, 
  delay = 0 
}: FloatingAnimationProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [intensity, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Pulse Animation Component
interface PulseAnimationProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
  delay?: number;
}

export function PulseAnimation({ 
  children, 
  intensity = 0.1, 
  duration = 2000, 
  delay = 0 
}: PulseAnimationProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1 + intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1 - intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [intensity, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Glow Animation Component
interface GlowAnimationProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  delay?: number;
}

export function GlowAnimation({ 
  children, 
  color = '#54FE54', 
  intensity = 0.5, 
  duration = 2000, 
  delay = 0 
}: GlowAnimationProps) {
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [intensity, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, intensity]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [4, 20]),
    shadowColor: color,
  }));

  return (
    <Animated.View style={[animatedStyle, { shadowOffset: { width: 0, height: 0 } }]}>
      {children}
    </Animated.View>
  );
}

// Magnetic Animation Component
interface MagneticAnimationProps {
  children: React.ReactNode;
  onPress?: () => void;
  intensity?: number;
}

export function MagneticAnimation({ 
  children, 
  onPress, 
  intensity = 20 
}: MagneticAnimationProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.05, { damping: 12, stiffness: 300 });
    translateX.value = withSpring(intensity, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(-intensity, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 150 });
    translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View 
      style={animatedStyle}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {children}
    </Animated.View>
  );
}

// Stagger Animation Component
interface StaggerAnimationProps {
  children: React.ReactNode[];
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity?: number;
}

export function StaggerAnimation({ 
  children, 
  delay = 100, 
  direction = 'up', 
  intensity = 50 
}: StaggerAnimationProps) {
  const getTransform = (index: number) => {
    const translateValue = useSharedValue(intensity);
    const opacity = useSharedValue(0);

    useEffect(() => {
      const startAnimation = () => {
        const animationDelay = index * delay;
        
        setTimeout(() => {
          translateValue.value = withSpring(0, { damping: 20, stiffness: 300 });
          opacity.value = withTiming(1, { duration: 400 });
        }, animationDelay);
      };

      startAnimation();
    }, [index, delay]);

    const animatedStyle = useAnimatedStyle(() => {
      let transform = {};
      
      switch (direction) {
        case 'up':
          transform = { translateY: translateValue.value };
          break;
        case 'down':
          transform = { translateY: -translateValue.value };
          break;
        case 'left':
          transform = { translateX: translateValue.value };
          break;
        case 'right':
          transform = { translateX: -translateValue.value };
          break;
      }

      return {
        transform: [transform],
        opacity: opacity.value,
      };
    });

    return animatedStyle;
  };

  return (
    <View>
      {children.map((child, index) => (
        <Animated.View key={index} style={getTransform(index)}>
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

// Wave Animation Component
interface WaveAnimationProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
  delay?: number;
}

export function WaveAnimation({ 
  children, 
  intensity = 5, 
  duration = 2000, 
  delay = 0 
}: WaveAnimationProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      rotation.value = withRepeat(
        withSequence(
          withTiming(intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(-intensity, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [intensity, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Bounce In Animation Component
interface BounceInAnimationProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  intensity?: number;
}

export function BounceInAnimation({ 
  children, 
  delay = 0, 
  duration = 800, 
  intensity = 0.3 
}: BounceInAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withSequence(
        withTiming(1 + intensity, { duration: duration * 0.3, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1 - intensity * 0.5, { duration: duration * 0.2, easing: Easing.out(Easing.back(1.2)) }),
        withTiming(1, { duration: duration * 0.5, easing: Easing.out(Easing.back(1.1)) })
      );
      opacity.value = withTiming(1, { duration: duration * 0.3 });
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [delay, duration, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Slide In Animation Component
interface SlideInAnimationProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  intensity?: number;
}

export function SlideInAnimation({ 
  children, 
  direction = 'left', 
  delay = 0, 
  duration = 600, 
  intensity = 100 
}: SlideInAnimationProps) {
  const translateX = useSharedValue(direction === 'left' ? -intensity : direction === 'right' ? intensity : 0);
  const translateY = useSharedValue(direction === 'up' ? -intensity : direction === 'down' ? intensity : 0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: duration });
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [delay, duration, intensity, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// Fade In Animation Component
interface FadeInAnimationProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeInAnimation({ 
  children, 
  delay = 0, 
  duration = 800 
}: FadeInAnimationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withTiming(1, { duration: duration });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    } else {
      startAnimation();
    }
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
