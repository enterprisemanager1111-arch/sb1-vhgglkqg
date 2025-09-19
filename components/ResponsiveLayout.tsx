import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, Text, TouchableOpacity } from 'react-native';
import { useResponsive, ResponsiveUtils } from '@/utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  maxWidth?: number;
  centerContent?: boolean;
}

export default function ResponsiveLayout({
  children,
  style,
  padding = true,
  maxWidth,
  centerContent = false,
}: ResponsiveLayoutProps) {
  const { getResponsivePadding, getLayoutDimensions, isDesktop } = useResponsive();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const responsivePadding = getResponsivePadding();
  const layoutDimensions = getLayoutDimensions();

  const containerStyle: ViewStyle = {
    flex: 1,
    ...(padding && {
      paddingHorizontal: responsivePadding.horizontal,
      paddingVertical: responsivePadding.vertical,
    }),
    ...(maxWidth && {
      maxWidth: isDesktop ? maxWidth : undefined,
      alignSelf: centerContent ? 'center' : 'stretch',
    }),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode[];
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
}

export function ResponsiveGrid({
  children,
  columns,
  spacing = 16,
  style,
}: ResponsiveGridProps) {
  const { getGridColumns, scaleWidth } = useResponsive();
  const gridColumns = columns || getGridColumns();
  const scaledSpacing = scaleWidth(spacing);

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -scaledSpacing / 2,
    ...style,
  };

  const itemStyle: ViewStyle = {
    width: `${100 / gridColumns}%`,
    paddingHorizontal: scaledSpacing / 2,
    paddingVertical: scaledSpacing / 2,
  };

  return (
    <View style={gridStyle}>
      {children.map((child, index) => (
        <View key={index} style={itemStyle}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  shadow?: boolean;
}

export function ResponsiveCard({
  children,
  style,
  padding = true,
  shadow = true,
}: ResponsiveCardProps) {
  const { getResponsivePadding, getShadow, getBorderRadius } = useResponsive();
  const responsivePadding = getResponsivePadding();
  const shadowStyle = getShadow().md;
  const borderRadius = getBorderRadius().lg;

  const cardStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius,
    ...(padding && {
      padding: responsivePadding.section,
    }),
    ...(shadow && shadowStyle),
    ...style,
  };

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  centerContent?: boolean;
  style?: ViewStyle;
}

export function ResponsiveContainer({
  children,
  maxWidth = 1200,
  centerContent = true,
  style,
}: ResponsiveContainerProps) {
  const { isDesktop, getResponsivePadding } = useResponsive();
  const responsivePadding = getResponsivePadding();

  const containerStyle: ViewStyle = {
    flex: 1,
    ...(isDesktop && {
      maxWidth,
      alignSelf: centerContent ? 'center' : 'stretch',
      paddingHorizontal: responsivePadding.horizontal,
    }),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  style?: any;
  numberOfLines?: number;
}

export function ResponsiveText({
  children,
  size = 'base',
  weight = 'normal',
  color = '#161618',
  style,
  numberOfLines,
}: ResponsiveTextProps) {
  const { getFontSizes } = useResponsive();
  const fontSizes = getFontSizes();

  const textStyle = {
    fontSize: fontSizes[size],
    fontWeight: weight,
    color,
    ...style,
  };

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// Responsive Button Component
interface ResponsiveButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: any;
}

export function ResponsiveButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}: ResponsiveButtonProps) {
  const { getSpacing, getBorderRadius, getFontSizes } = useResponsive();
  const spacing = getSpacing();
  const borderRadius = getBorderRadius();
  const fontSizes = getFontSizes();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };

    // Size variants
    switch (size) {
      case 'sm':
        return {
          ...baseStyle,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        };
      case 'lg':
        return {
          ...baseStyle,
          paddingHorizontal: spacing['2xl'],
          paddingVertical: spacing.lg,
        };
      default: // md
        return {
          ...baseStyle,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
        };
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontFamily: 'Montserrat-SemiBold',
      fontSize: fontSizes[size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'],
    };

    switch (variant) {
      case 'primary':
        return { ...baseTextStyle, color: '#161618' };
      case 'secondary':
        return { ...baseTextStyle, color: '#666666' };
      case 'outline':
        return { ...baseTextStyle, color: '#54FE54' };
      default:
        return { ...baseTextStyle, color: '#161618' };
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return '#54FE54';
      case 'secondary':
        return '#F0F0F0';
      case 'outline':
        return 'transparent';
      default:
        return '#54FE54';
    }
  };

  const buttonStyle: ViewStyle = {
    ...getButtonStyle(),
    backgroundColor: getBackgroundColor(),
    ...(variant === 'outline' && {
      borderWidth: 1,
      borderColor: '#54FE54',
    }),
    ...style,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// Responsive Modal Component
interface ResponsiveModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export function ResponsiveModal({
  visible,
  onClose,
  children,
  title,
  style,
}: ResponsiveModalProps) {
  const { isMobile, getResponsivePadding, getBorderRadius, getShadow } = useResponsive();
  const responsivePadding = getResponsivePadding();
  const borderRadius = getBorderRadius();
  const shadowStyle = getShadow().xl;

  if (!visible) return null;

  const modalStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const contentStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: responsivePadding.section,
    margin: responsivePadding.horizontal,
    maxWidth: isMobile ? '90%' : 500,
    maxHeight: '80%',
    ...shadowStyle,
    ...style,
  };

  return (
    <View style={modalStyle}>
      <View style={contentStyle}>
        {title && (
          <ResponsiveText size="xl" weight="bold" style={{ marginBottom: responsivePadding.lg }}>
            {title}
          </ResponsiveText>
        )}
        {children}
      </View>
    </View>
  );
}
