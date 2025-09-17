import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { DesignTokens } from './DesignTokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    style,
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // === BASE ===
  base: {
    borderRadius: DesignTokens.radius.lg,
  },

  // === VARIANTS ===
  default: {
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    ...DesignTokens.shadows.md,
  },
  glass: {
    backgroundColor: DesignTokens.colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...DesignTokens.shadows.sm,
  },
  elevated: {
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    ...DesignTokens.shadows.lg,
  },
  outlined: {
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[200],
    ...DesignTokens.shadows.sm,
  },

  // === PADDING ===
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: DesignTokens.spacing.md,
  },
  paddingMedium: {
    padding: DesignTokens.spacing.xl,
  },
  paddingLarge: {
    padding: DesignTokens.spacing['2xl'],
  },
});

// === SPECIALIZED CARDS ===
export const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}> = ({ icon, title, value, subtitle, color = DesignTokens.colors.primary[400] }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      {icon}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

const statCardStyles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.xl,
    alignItems: 'center',
    ...DesignTokens.shadows.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  statValue: {
    fontSize: DesignTokens.typography.sizes.display.small,
    fontFamily: DesignTokens.typography.fonts.display,
    color: DesignTokens.colors.neutral[900],
    marginBottom: DesignTokens.spacing.xs,
  },
  statTitle: {
    fontSize: DesignTokens.typography.sizes.ui.small,
    fontFamily: DesignTokens.typography.fonts.caption,
    color: DesignTokens.colors.neutral[500],
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: DesignTokens.typography.sizes.ui.small,
    fontFamily: DesignTokens.typography.fonts.caption,
    color: DesignTokens.colors.neutral[400],
    textAlign: 'center',
    marginTop: DesignTokens.spacing.xs,
  },
});

Object.assign(styles, statCardStyles);