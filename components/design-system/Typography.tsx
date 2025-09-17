import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { DesignTokens } from './DesignTokens';

/**
 * Zentrale Typografie-Komponenten für konsistente Textdarstellung
 */

interface BaseTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  onPress?: () => void;
}

// === DISPLAY TEXTE (Headlines) ===
export const DisplayLarge: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.displayLarge, style]} {...props}>
    {children}
  </Text>
);

export const DisplayMedium: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.displayMedium, style]} {...props}>
    {children}
  </Text>
);

export const DisplaySmall: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.displaySmall, style]} {...props}>
    {children}
  </Text>
);

// === HEADINGS ===
export const HeadingLarge: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.headingLarge, style]} {...props}>
    {children}
  </Text>
);

export const HeadingMedium: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.headingMedium, style]} {...props}>
    {children}
  </Text>
);

export const HeadingSmall: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.headingSmall, style]} {...props}>
    {children}
  </Text>
);

// === BODY TEXTE ===
export const BodyLarge: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.bodyLarge, style]} {...props}>
    {children}
  </Text>
);

export const BodyMedium: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.bodyMedium, style]} {...props}>
    {children}
  </Text>
);

export const BodySmall: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.bodySmall, style]} {...props}>
    {children}
  </Text>
);

// === UI TEXTE ===
export const UILarge: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.uiLarge, style]} {...props}>
    {children}
  </Text>
);

export const UIMedium: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.uiMedium, style]} {...props}>
    {children}
  </Text>
);

export const UISmall: React.FC<BaseTextProps> = ({ children, style, ...props }) => (
  <Text style={[styles.uiSmall, style]} {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  // === DISPLAY STYLES ===
  displayLarge: {
    fontSize: DesignTokens.typography.sizes.display.large,
    fontFamily: DesignTokens.typography.fonts.display,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.display.large * DesignTokens.typography.lineHeights.tight,
  },
  displayMedium: {
    fontSize: DesignTokens.typography.sizes.display.medium,
    fontFamily: DesignTokens.typography.fonts.display,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.display.medium * DesignTokens.typography.lineHeights.tight,
  },
  displaySmall: {
    fontSize: DesignTokens.typography.sizes.display.small,
    fontFamily: DesignTokens.typography.fonts.display,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.display.small * DesignTokens.typography.lineHeights.tight,
  },

  // === HEADING STYLES ===
  headingLarge: {
    fontSize: DesignTokens.typography.sizes.heading.large,
    fontFamily: DesignTokens.typography.fonts.heading,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.heading.large * DesignTokens.typography.lineHeights.normal,
  },
  headingMedium: {
    fontSize: DesignTokens.typography.sizes.heading.medium,
    fontFamily: DesignTokens.typography.fonts.heading,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.heading.medium * DesignTokens.typography.lineHeights.normal,
  },
  headingSmall: {
    fontSize: DesignTokens.typography.sizes.heading.small,
    fontFamily: DesignTokens.typography.fonts.heading,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.heading.small * DesignTokens.typography.lineHeights.normal,
  },

  // === BODY STYLES ===
  bodyLarge: {
    fontSize: DesignTokens.typography.sizes.body.large,
    fontFamily: DesignTokens.typography.fonts.body,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.body.large * DesignTokens.typography.lineHeights.normal,
  },
  bodyMedium: {
    fontSize: DesignTokens.typography.sizes.body.medium,
    fontFamily: DesignTokens.typography.fonts.body,
    color: DesignTokens.colors.neutral[600],
    lineHeight: DesignTokens.typography.sizes.body.medium * DesignTokens.typography.lineHeights.normal,
  },
  bodySmall: {
    fontSize: DesignTokens.typography.sizes.body.small,
    fontFamily: DesignTokens.typography.fonts.body,
    color: DesignTokens.colors.neutral[500],
    lineHeight: DesignTokens.typography.sizes.body.small * DesignTokens.typography.lineHeights.normal,
  },

  // === UI STYLES ===
  uiLarge: {
    fontSize: DesignTokens.typography.sizes.ui.large,
    fontFamily: DesignTokens.typography.fonts.ui,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.ui.large * DesignTokens.typography.lineHeights.normal,
  },
  uiMedium: {
    fontSize: DesignTokens.typography.sizes.ui.medium,
    fontFamily: DesignTokens.typography.fonts.ui,
    color: DesignTokens.colors.neutral[900],
    lineHeight: DesignTokens.typography.sizes.ui.medium * DesignTokens.typography.lineHeights.normal,
  },
  uiSmall: {
    fontSize: DesignTokens.typography.sizes.ui.small,
    fontFamily: DesignTokens.typography.fonts.caption,
    color: DesignTokens.colors.neutral[500],
    lineHeight: DesignTokens.typography.sizes.ui.small * DesignTokens.typography.lineHeights.normal,
    letterSpacing: 0.3,
  },
});