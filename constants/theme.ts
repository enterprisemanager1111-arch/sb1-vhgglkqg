// Dark mode theme constants
export const colors = {
  light: {
    background: '#f1f3f8',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#FEFEFE',
    text: '#2d2d2d',
    textSecondary: '#666666',
    textTertiary: '#466759',
    border: '#EAECF0',
    borderLight: '#F0F0F0',
    input: '#F3F3F5',
    inputBorder: '#E0E0E0',
    shadow: '#2d2d2d',
    card: '#FFFFFF',
    placeholder: '#999999',
  },
  dark: {
    background: '#1a1a1a',
    backgroundAlt: '#0f0f0f',
    surface: '#2d2d2d',
    surfaceSecondary: '#353535',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textTertiary: '#8a9a8f',
    border: '#404040',
    borderLight: '#505050',
    input: '#353535',
    inputBorder: '#505050',
    shadow: '#000000',
    card: '#2d2d2d',
    placeholder: '#707070',
  },
};

// Common colors that don't change with theme
export const brandColors = {
  primary: '#17F196',
  primaryDark: '#12c777',
  secondary: '#6366F1',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export const getTheme = (isDarkMode: boolean) => {
  return isDarkMode ? colors.dark : colors.light;
};

