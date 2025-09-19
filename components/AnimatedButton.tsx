import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  animationType?: 'scale' | 'bounce' | 'press' | 'pulse' | 'shake' | 'glow' | 'magnetic' | 'none';
  hapticFeedback?: boolean;
}

export default function AnimatedButton({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  animationType = 'scale',
  hapticFeedback = true,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const pressProgress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const magneticOffset = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    let scaleValue = 1;
    let rotationValue = 0;
    let translateX = 0;
    let shadowOpacity = 0.3;
    
    switch (animationType) {
      case 'scale':
        scaleValue = scale.value;
        break;
      case 'bounce':
        scaleValue = scale.value;
        break;
      case 'press':
        scaleValue = 1 - (pressProgress.value * 0.05);
        break;
      case 'pulse':
        scaleValue = pulseScale.value;
        break;
      case 'shake':
        translateX = rotation.value;
        break;
      case 'glow':
        scaleValue = scale.value;
        shadowOpacity = interpolate(glowIntensity.value, [0, 1], [0.3, 0.8]);
        break;
      case 'magnetic':
        scaleValue = scale.value;
        translateX = magneticOffset.value;
        break;
    }
    
    return {
      transform: [
        { scale: scaleValue },
        { rotate: `${rotationValue}deg` },
        { translateX: translateX }
      ],
      opacity: disabled ? 0.6 : 1,
      shadowOpacity: shadowOpacity,
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    
    if (hapticFeedback) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
    
    switch (animationType) {
      case 'scale':
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        break;
      case 'bounce':
        scale.value = withSequence(
          withSpring(0.85, { damping: 8, stiffness: 400 }),
          withSpring(0.95, { damping: 12, stiffness: 300 }),
          withSpring(1, { damping: 15, stiffness: 200 })
        );
        break;
      case 'press':
        pressProgress.value = withTiming(1, { duration: 100 });
        break;
      case 'pulse':
        pulseScale.value = withSequence(
          withSpring(1.1, { damping: 10, stiffness: 300 }),
          withSpring(1, { damping: 15, stiffness: 200 })
        );
        break;
      case 'shake':
        rotation.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        break;
      case 'glow':
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        glowIntensity.value = withTiming(1, { duration: 200 });
        break;
      case 'magnetic':
        scale.value = withSpring(1.05, { damping: 12, stiffness: 300 });
        magneticOffset.value = withSpring(5, { damping: 15, stiffness: 200 });
        break;
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    switch (animationType) {
      case 'scale':
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        break;
      case 'bounce':
        // Already handled in press in
        break;
      case 'press':
        pressProgress.value = withTiming(0, { duration: 150 });
        break;
      case 'pulse':
        // Already handled in press in
        break;
      case 'shake':
        // Already handled in press in
        break;
      case 'glow':
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        glowIntensity.value = withTiming(0, { duration: 300 });
        break;
      case 'magnetic':
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        magneticOffset.value = withSpring(0, { damping: 15, stiffness: 200 });
        break;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.base, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'ghost':
        return [...baseStyle, styles.ghost];
      case 'destructive':
        return [...baseStyle, styles.destructive];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.baseText, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        return [...baseTextStyle, styles.primaryText];
      case 'secondary':
        return [...baseTextStyle, styles.secondaryText];
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      case 'ghost':
        return [...baseTextStyle, styles.ghostText];
      case 'destructive':
        return [...baseTextStyle, styles.destructiveText];
      default:
        return [...baseTextStyle, styles.primaryText];
    }
  };

  return (
    <AnimatedPressable
      style={[getButtonStyle(), animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <React.Fragment>{icon}</React.Fragment>
      )}
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      {icon && iconPosition === 'right' && (
        <React.Fragment>{icon}</React.Fragment>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  baseText: {
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },

  // Variants
  primary: {
    backgroundColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#54FE54',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Text variants
  primaryText: {
    color: '#161618',
  },
  secondaryText: {
    color: '#666666',
  },
  outlineText: {
    color: '#54FE54',
  },
  ghostText: {
    color: '#666666',
  },
  destructiveText: {
    color: '#FFFFFF',
  },

  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },

  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
