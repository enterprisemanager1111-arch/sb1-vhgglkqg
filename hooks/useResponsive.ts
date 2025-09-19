import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useResponsive as useResponsiveUtils } from '@/utils/responsive';

// Enhanced responsive hook with window resize detection
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const responsiveUtils = useResponsiveUtils();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...responsiveUtils,
    dimensions,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
  };
};

// Hook for responsive breakpoint detection
export const useBreakpoint = () => {
  const { screenWidth } = useResponsive();
  
  return {
    isXs: screenWidth >= 0,
    isSm: screenWidth >= 576,
    isMd: screenWidth >= 768,
    isLg: screenWidth >= 992,
    isXl: screenWidth >= 1200,
    isXxl: screenWidth >= 1400,
  };
};

// Hook for responsive values
export const useResponsiveValue = <T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  } else if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  } else if (isDesktop && values.desktop !== undefined) {
    return values.desktop;
  }
  
  return values.default;
};

// Hook for responsive styles
export const useResponsiveStyles = <T extends Record<string, any>>(
  styles: T
): T => {
  const { scaleFontSize, scaleWidth, scaleHeight } = useResponsive();
  
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
};

// Hook for responsive layout
export const useResponsiveLayout = () => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    getGridColumns, 
    getCardWidth, 
    getResponsivePadding,
    getLayoutDimensions 
  } = useResponsive();

  return {
    columns: getGridColumns(),
    cardWidth: getCardWidth(),
    padding: getResponsivePadding(),
    layout: getLayoutDimensions(),
    isMobile,
    isTablet,
    isDesktop,
  };
};

// Hook for responsive animations
export const useResponsiveAnimations = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return {
    // Animation durations based on device type
    duration: {
      fast: isMobile ? 200 : 300,
      normal: isMobile ? 300 : 400,
      slow: isMobile ? 500 : 600,
    },
    // Animation scales based on device type
    scale: {
      press: isMobile ? 0.95 : 0.98,
      hover: isMobile ? 1.02 : 1.05,
    },
    // Spring configurations based on device type
    spring: {
      damping: isMobile ? 15 : 20,
      stiffness: isMobile ? 200 : 300,
    },
  };
};
