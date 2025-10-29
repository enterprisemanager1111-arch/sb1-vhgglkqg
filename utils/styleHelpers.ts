import { StyleSheet } from 'react-native';
import { getTheme } from '@/constants/theme';

/**
 * Helper function to create theme-aware styles
 * Usage: const styles = createThemedStyles(isDarkMode, (theme) => ({ ... }));
 */
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  isDarkMode: boolean,
  stylesFactory: (theme: ReturnType<typeof getTheme>) => T
): T => {
  const theme = getTheme(isDarkMode);
  return StyleSheet.create(stylesFactory(theme));
};

