import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { DesignTokens, ComponentStyles } from './DesignTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, DesignTokens.animations.easing.bounce);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DesignTokens.animations.easing.smooth);
  };

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <AnimatedPressable
      style={[buttonStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <React.Fragment>{icon}</React.Fragment>
      )}
      <Text style={textStyleCombined}>{children}</Text>
      {icon && iconPosition === 'right' && (
        <React.Fragment>{icon}</React.Fragment>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  // === BASE STYLES ===
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.radius.md,
    gap: DesignTokens.spacing.sm,
  },
  baseText: {
    fontFamily: DesignTokens.typography.fonts.ui,
    textAlign: 'center',
  },

  // === VARIANTS ===
  primary: {
    backgroundColor: DesignTokens.colors.primary[400],
    ...DesignTokens.shadows.colored.primary,
  },
  secondary: {
    backgroundColor: DesignTokens.colors.neutral[100],
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[200],
    ...DesignTokens.shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignTokens.colors.primary[400],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: DesignTokens.colors.error,
    ...DesignTokens.shadows.md,
  },

  // === TEXT VARIANTS ===
  primaryText: {
    color: DesignTokens.colors.neutral[900],
  },
  secondaryText: {
    color: DesignTokens.colors.neutral[600],
  },
  outlineText: {
    color: DesignTokens.colors.primary[600],
  },
  ghostText: {
    color: DesignTokens.colors.neutral[600],
  },
  destructiveText: {
    color: DesignTokens.colors.neutral[50],
  },

  // === SIZES ===
  small: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.sm,
  },
  medium: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
  },
  large: {
    paddingHorizontal: DesignTokens.spacing['2xl'],
    paddingVertical: DesignTokens.spacing.xl,
    borderRadius: DesignTokens.radius.lg,
  },

  // === TEXT SIZES ===
  smallText: {
    fontSize: DesignTokens.typography.sizes.ui.medium,
  },
  mediumText: {
    fontSize: DesignTokens.typography.sizes.ui.large,
  },
  largeText: {
    fontSize: DesignTokens.typography.sizes.heading.small,
  },

  // === STATES ===
  disabled: {
    backgroundColor: DesignTokens.colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: DesignTokens.colors.neutral[400],
  },
});