import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContextType {
  // Device type
  deviceType: string;
  screenSize: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Screen dimensions
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  
  // Responsive utilities
  getResponsiveValue: <T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }) => T;
  
  // Scaling functions
  scaleFontSize: (size: number) => number;
  scaleWidth: (width: number) => number;
  scaleHeight: (height: number) => number;
  
  // Layout utilities
  getResponsivePadding: () => {
    horizontal: number;
    vertical: number;
    section: number;
  };
  getGridColumns: () => number;
  getCardWidth: () => number;
  
  // Style utilities
  getFontSizes: () => Record<string, number>;
  getSpacing: () => Record<string, number>;
  getBorderRadius: () => Record<string, number>;
  getShadow: () => Record<string, any>;
  getSafeAreaInsets: () => {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  getLayoutDimensions: () => {
    screenWidth: number;
    screenHeight: number;
    contentWidth: number;
    contentHeight: number;
    headerHeight: number;
    tabBarHeight: number;
    cardHeight: number;
  };
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

interface ResponsiveProviderProps {
  children: React.ReactNode;
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const responsive = useResponsive();

  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsiveContext(): ResponsiveContextType {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsiveContext must be used within a ResponsiveProvider');
  }
  return context;
}

// Hook for responsive breakpoint detection
export function useBreakpoint() {
  const { screenWidth } = useResponsiveContext();
  
  return {
    isXs: screenWidth >= 0,
    isSm: screenWidth >= 576,
    isMd: screenWidth >= 768,
    isLg: screenWidth >= 992,
    isXl: screenWidth >= 1200,
    isXxl: screenWidth >= 1400,
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const { isMobile, isTablet, isDesktop } = useResponsiveContext();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  } else if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  } else if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return values.default;
}

// Hook for responsive styles
export function useResponsiveStyles<T extends Record<string, any>>(
  styles: T
): T {
  const { scaleFontSize, scaleWidth, scaleHeight } = useResponsiveContext();
  
  const responsiveStyles = {} as T;
  
  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    if (typeof style === 'object' && style !== null) {
      responsiveStyles[key] = {
        ...style,
        // Auto-scale common properties
        fontSize: style.fontSize ? scaleFontSize(style.fontSize) : undefined,
        padding: style.padding ? scaleWidth(style.padding) : undefined,
        paddingHorizontal: style.paddingHorizontal ? scaleWidth(style.paddingHorizontal) : undefined,
        paddingVertical: style.paddingVertical ? scaleHeight(style.paddingVertical) : undefined,
        margin: style.margin ? scaleWidth(style.margin) : undefined,
        marginHorizontal: style.marginHorizontal ? scaleWidth(style.marginHorizontal) : undefined,
        marginVertical: style.marginVertical ? scaleHeight(style.marginVertical) : undefined,
        borderRadius: style.borderRadius ? scaleWidth(style.borderRadius) : undefined,
        width: style.width && typeof style.width === 'number' ? scaleWidth(style.width) : style.width,
        height: style.height && typeof style.height === 'number' ? scaleHeight(style.height) : style.height,
      };
    } else {
      responsiveStyles[key] = style;
    }
  });
  
  return responsiveStyles;
}
