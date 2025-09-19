import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

// Device type detection
export const DEVICE_TYPES = {
  PHONE: 'phone',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;

// Screen size categories
export const SCREEN_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extra-large',
} as const;

// Responsive utilities
export class ResponsiveUtils {
  // Get current device type
  static getDeviceType(): string {
    if (SCREEN_WIDTH < BREAKPOINTS.md) {
      return DEVICE_TYPES.PHONE;
    } else if (SCREEN_WIDTH < BREAKPOINTS.lg) {
      return DEVICE_TYPES.TABLET;
    } else {
      return DEVICE_TYPES.DESKTOP;
    }
  }

  // Get current screen size category
  static getScreenSize(): string {
    if (SCREEN_WIDTH < BREAKPOINTS.sm) {
      return SCREEN_SIZES.SMALL;
    } else if (SCREEN_WIDTH < BREAKPOINTS.md) {
      return SCREEN_SIZES.MEDIUM;
    } else if (SCREEN_WIDTH < BREAKPOINTS.xl) {
      return SCREEN_SIZES.LARGE;
    } else {
      return SCREEN_SIZES.EXTRA_LARGE;
    }
  }

  // Check if current screen matches breakpoint
  static isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
    return SCREEN_WIDTH >= BREAKPOINTS[breakpoint];
  }

  // Check if screen is mobile
  static isMobile(): boolean {
    return SCREEN_WIDTH < BREAKPOINTS.md;
  }

  // Check if screen is tablet
  static isTablet(): boolean {
    return SCREEN_WIDTH >= BREAKPOINTS.md && SCREEN_WIDTH < BREAKPOINTS.lg;
  }

  // Check if screen is desktop
  static isDesktop(): boolean {
    return SCREEN_WIDTH >= BREAKPOINTS.lg;
  }

  // Get responsive value based on screen size
  static getResponsiveValue<T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }): T {
    if (this.isMobile() && values.mobile !== undefined) {
      return values.mobile;
    } else if (this.isTablet() && values.tablet !== undefined) {
      return values.tablet;
    } else if (this.isDesktop() && values.desktop !== undefined) {
      return values.desktop;
    }
    return values.default;
  }

  // Scale font size based on screen width
  static scaleFontSize(size: number): number {
    const scale = SCREEN_WIDTH / 375; // Base width (iPhone X)
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }

  // Scale dimensions based on screen width
  static scaleWidth(width: number): number {
    const scale = SCREEN_WIDTH / 375; // Base width (iPhone X)
    return Math.round(PixelRatio.roundToNearestPixel(width * scale));
  }

  // Scale dimensions based on screen height
  static scaleHeight(height: number): number {
    const scale = SCREEN_HEIGHT / 812; // Base height (iPhone X)
    return Math.round(PixelRatio.roundToNearestPixel(height * scale));
  }

  // Get responsive padding
  static getResponsivePadding(): {
    horizontal: number;
    vertical: number;
    section: number;
  } {
    return this.getResponsiveValue({
      mobile: {
        horizontal: 16,
        vertical: 12,
        section: 24,
      },
      tablet: {
        horizontal: 24,
        vertical: 16,
        section: 32,
      },
      desktop: {
        horizontal: 32,
        vertical: 20,
        section: 40,
      },
      default: {
        horizontal: 16,
        vertical: 12,
        section: 24,
      },
    });
  }

  // Get responsive grid columns
  static getGridColumns(): number {
    return this.getResponsiveValue({
      mobile: 1,
      tablet: 2,
      desktop: 3,
      default: 1,
    });
  }

  // Get responsive card width
  static getCardWidth(): number {
    return this.getResponsiveValue({
      mobile: SCREEN_WIDTH - 32,
      tablet: (SCREEN_WIDTH - 48) / 2,
      desktop: (SCREEN_WIDTH - 64) / 3,
      default: SCREEN_WIDTH - 32,
    });
  }

  // Get responsive font sizes
  static getFontSizes() {
    return {
      xs: this.scaleFontSize(12),
      sm: this.scaleFontSize(14),
      base: this.scaleFontSize(16),
      lg: this.scaleFontSize(18),
      xl: this.scaleFontSize(20),
      '2xl': this.scaleFontSize(24),
      '3xl': this.scaleFontSize(28),
      '4xl': this.scaleFontSize(32),
      '5xl': this.scaleFontSize(36),
    };
  }

  // Get responsive spacing
  static getSpacing() {
    return {
      xs: this.scaleWidth(4),
      sm: this.scaleWidth(8),
      md: this.scaleWidth(12),
      lg: this.scaleWidth(16),
      xl: this.scaleWidth(20),
      '2xl': this.scaleWidth(24),
      '3xl': this.scaleWidth(32),
      '4xl': this.scaleWidth(40),
      '5xl': this.scaleWidth(48),
      '6xl': this.scaleWidth(64),
    };
  }

  // Get responsive border radius
  static getBorderRadius() {
    return {
      sm: this.scaleWidth(4),
      md: this.scaleWidth(8),
      lg: this.scaleWidth(12),
      xl: this.scaleWidth(16),
      '2xl': this.scaleWidth(20),
      full: 999,
    };
  }

  // Get responsive shadow
  static getShadow() {
    return {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: this.scaleWidth(2),
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: this.scaleWidth(4),
        elevation: 2,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: this.scaleWidth(8),
        elevation: 4,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: this.scaleWidth(16),
        elevation: 8,
      },
    };
  }

  // Get safe area insets
  static getSafeAreaInsets() {
    return {
      top: Platform.OS === 'ios' ? 44 : 24,
      bottom: Platform.OS === 'ios' ? 34 : 0,
      left: 0,
      right: 0,
    };
  }

  // Get responsive layout dimensions
  static getLayoutDimensions() {
    const safeArea = this.getSafeAreaInsets();
    return {
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      contentWidth: SCREEN_WIDTH - (this.getResponsivePadding().horizontal * 2),
      contentHeight: SCREEN_HEIGHT - safeArea.top - safeArea.bottom,
      headerHeight: this.scaleHeight(60),
      tabBarHeight: this.scaleHeight(80) + safeArea.bottom,
      cardHeight: this.scaleHeight(120),
    };
  }
}

// Responsive hook for React components
export const useResponsive = () => {
  return {
    deviceType: ResponsiveUtils.getDeviceType(),
    screenSize: ResponsiveUtils.getScreenSize(),
    isMobile: ResponsiveUtils.isMobile(),
    isTablet: ResponsiveUtils.isTablet(),
    isDesktop: ResponsiveUtils.isDesktop(),
    getResponsiveValue: ResponsiveUtils.getResponsiveValue.bind(ResponsiveUtils),
    scaleFontSize: ResponsiveUtils.scaleFontSize.bind(ResponsiveUtils),
    scaleWidth: ResponsiveUtils.scaleWidth.bind(ResponsiveUtils),
    scaleHeight: ResponsiveUtils.scaleHeight.bind(ResponsiveUtils),
    getResponsivePadding: ResponsiveUtils.getResponsivePadding.bind(ResponsiveUtils),
    getGridColumns: ResponsiveUtils.getGridColumns.bind(ResponsiveUtils),
    getCardWidth: ResponsiveUtils.getCardWidth.bind(ResponsiveUtils),
    getFontSizes: ResponsiveUtils.getFontSizes.bind(ResponsiveUtils),
    getSpacing: ResponsiveUtils.getSpacing.bind(ResponsiveUtils),
    getBorderRadius: ResponsiveUtils.getBorderRadius.bind(ResponsiveUtils),
    getShadow: ResponsiveUtils.getShadow.bind(ResponsiveUtils),
    getSafeAreaInsets: ResponsiveUtils.getSafeAreaInsets.bind(ResponsiveUtils),
    getLayoutDimensions: ResponsiveUtils.getLayoutDimensions.bind(ResponsiveUtils),
  };
};

// Responsive style generator
export const createResponsiveStyle = <T extends Record<string, any>>(
  styles: T
): T => {
  const responsiveStyles = {} as T;
  
  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    if (typeof style === 'object' && style !== null) {
      (responsiveStyles as any)[key] = {
        ...style,
        // Auto-scale common properties
        fontSize: style.fontSize ? ResponsiveUtils.scaleFontSize(style.fontSize) : undefined,
        padding: style.padding ? ResponsiveUtils.scaleWidth(style.padding) : undefined,
        paddingHorizontal: style.paddingHorizontal ? ResponsiveUtils.scaleWidth(style.paddingHorizontal) : undefined,
        paddingVertical: style.paddingVertical ? ResponsiveUtils.scaleHeight(style.paddingVertical) : undefined,
        margin: style.margin ? ResponsiveUtils.scaleWidth(style.margin) : undefined,
        marginHorizontal: style.marginHorizontal ? ResponsiveUtils.scaleWidth(style.marginHorizontal) : undefined,
        marginVertical: style.marginVertical ? ResponsiveUtils.scaleHeight(style.marginVertical) : undefined,
        borderRadius: style.borderRadius ? ResponsiveUtils.scaleWidth(style.borderRadius) : undefined,
        width: style.width && typeof style.width === 'number' ? ResponsiveUtils.scaleWidth(style.width) : style.width,
        height: style.height && typeof style.height === 'number' ? ResponsiveUtils.scaleHeight(style.height) : style.height,
      };
    } else {
      (responsiveStyles as any)[key] = style;
    }
  });
  
  return responsiveStyles;
};

// Export constants for easy access
export const {
  getDeviceType,
  getScreenSize,
  isMobile,
  isTablet,
  isDesktop,
} = ResponsiveUtils;

// Export bound methods to preserve 'this' context
export const getResponsiveValue = ResponsiveUtils.getResponsiveValue.bind(ResponsiveUtils);
export const scaleFontSize = ResponsiveUtils.scaleFontSize.bind(ResponsiveUtils);
export const scaleWidth = ResponsiveUtils.scaleWidth.bind(ResponsiveUtils);
export const scaleHeight = ResponsiveUtils.scaleHeight.bind(ResponsiveUtils);
export const getResponsivePadding = ResponsiveUtils.getResponsivePadding.bind(ResponsiveUtils);
export const getGridColumns = ResponsiveUtils.getGridColumns.bind(ResponsiveUtils);
export const getCardWidth = ResponsiveUtils.getCardWidth.bind(ResponsiveUtils);
export const getFontSizes = ResponsiveUtils.getFontSizes.bind(ResponsiveUtils);
export const getSpacing = ResponsiveUtils.getSpacing.bind(ResponsiveUtils);
export const getBorderRadius = ResponsiveUtils.getBorderRadius.bind(ResponsiveUtils);
export const getShadow = ResponsiveUtils.getShadow.bind(ResponsiveUtils);
export const getSafeAreaInsets = ResponsiveUtils.getSafeAreaInsets.bind(ResponsiveUtils);
export const getLayoutDimensions = ResponsiveUtils.getLayoutDimensions.bind(ResponsiveUtils);
