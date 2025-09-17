/**
 * Famora Design System - Zentrale Design Tokens
 * Konsistente Design-Werte für die gesamte App
 */

export const DesignTokens = {
  // === FARBPALETTE ===
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#F0FFF4',
      100: '#DCFEE8',
      200: '#BBF7D0', 
      300: '#86EFAC',
      400: '#54FE54', // Haupt-Primärfarbe
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
    },
    
    // Neutral Grautöne
    neutral: {
      50: '#FAFAFA',
      100: '#F3F3F5', // App Background
      200: '#E0E0E0',  // Borders
      300: '#CCCCCC',
      400: '#999999',
      500: '#666666',  // Secondary Text
      600: '#4A4A4A',
      700: '#333333',
      800: '#1A1A1A',
      900: '#161618',  // Primary Text
    },
    
    // Semantic Colors
    success: '#22C55E',
    warning: '#FFB800',
    error: '#EF4444',
    info: '#00D4FF',
    
    // Status Colors
    online: '#54FE54',
    offline: '#E0E0E0',
    
    // Background Variants
    backgrounds: {
      primary: '#FFFFFF',
      secondary: '#F3F3F5',
      tertiary: 'rgba(84, 254, 84, 0.05)',
      glass: 'rgba(191, 232, 236, 0.15)',
      modal: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Spezielle Farben
    glass: 'rgba(191, 232, 236, 0.15)', // Glas-Effekt
    overlay: 'rgba(0, 0, 0, 0.5)',     // Modal Overlay
  },

  // === TYPOGRAFIE ===
  typography: {
    fonts: {
      display: 'Montserrat-Bold',      // 28px+ Headlines
      heading: 'Montserrat-SemiBold',  // 18-24px Überschriften  
      body: 'Montserrat-Regular',      // 14-16px Body Text
      caption: 'Montserrat-Medium',    // 12-13px Small Text
      ui: 'Inter-SemiBold',           // UI Buttons/Labels
    },
    
    sizes: {
      // Display (Headlines)
      display: {
        large: 32,   // Onboarding Titles
        medium: 28,  // Page Titles
        small: 24,   // Section Headers
      },
      
      // Headings
      heading: {
        large: 20,   // Main Section Titles
        medium: 18,  // Subsection Titles
        small: 16,   // Card Titles
      },
      
      // Body Text
      body: {
        large: 16,   // Primary Body
        medium: 14,  // Secondary Body
        small: 13,   // Captions
      },
      
      // UI Elements
      ui: {
        large: 17,   // Primary Buttons
        medium: 14,  // Secondary Buttons
        small: 12,   // Labels/Badges
      },
    },
    
    lineHeights: {
      tight: 1.2,    // Headlines
      normal: 1.4,   // Body Text
      relaxed: 1.6,  // Long Text
    },
  },

  // === SPACING SYSTEM (8px Grid) ===
  spacing: {
    xs: 4,     // 0.25rem
    sm: 8,     // 0.5rem
    md: 12,    // 0.75rem  
    lg: 16,    // 1rem
    xl: 20,    // 1.25rem
    '2xl': 24, // 1.5rem - Standard Section Padding
    '3xl': 32, // 2rem - Large Sections
    '4xl': 40, // 2.5rem
    '5xl': 48, // 3rem
    '6xl': 64, // 4rem
  },

  // === BORDER RADIUS ===
  radius: {
    sm: 8,    // Small elements
    md: 12,   // Standard cards/buttons
    lg: 16,   // Large cards
    xl: 20,   // Modals/important elements
    full: 999, // Circular elements
  },

  // === SCHATTEN ===
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    colored: {
      primary: {
        shadowColor: '#54FE54',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  },

  // === ANIMATION TIMING ===
  animations: {
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      bounce: { damping: 15, stiffness: 200 },
      smooth: { damping: 20, stiffness: 150 },
      gentle: { damping: 25, stiffness: 100 },
    },
  },
} as const;

// === KOMPONENTEN-STILE ===
export const ComponentStyles = {
  // Standard Card
  card: {
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing['2xl'],
    ...DesignTokens.shadows.md,
  },
  
  // Glass Card
  glassCard: {
    backgroundColor: DesignTokens.colors.glass,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...DesignTokens.shadows.md,
  },
  
  // Primary Button
  primaryButton: {
    backgroundColor: DesignTokens.colors.primary[400],
    borderRadius: DesignTokens.radius.md,
    paddingVertical: DesignTokens.spacing.lg,
    paddingHorizontal: DesignTokens.spacing['2xl'],
    ...DesignTokens.shadows.colored.primary,
  },
  
  // Input Field
  input: {
    backgroundColor: DesignTokens.colors.backgrounds.primary,
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.lg,
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[200],
    fontSize: DesignTokens.typography.sizes.body.large,
    fontFamily: DesignTokens.typography.fonts.body,
    color: DesignTokens.colors.neutral[900],
    ...DesignTokens.shadows.sm,
  },
};

// === LAYOUT KONSTANTEN ===
export const Layout = {
  screenPadding: DesignTokens.spacing['2xl'],     // 24px
  sectionSpacing: DesignTokens.spacing['3xl'],    // 32px  
  cardSpacing: DesignTokens.spacing.lg,           // 16px
  elementSpacing: DesignTokens.spacing.md,        // 12px
  
  // Container Größen
  maxContentWidth: 400,
  tabBarHeight: 100,
  headerHeight: 80,
  
  // Grid System
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};