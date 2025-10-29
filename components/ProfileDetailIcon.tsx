import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';

interface ProfileDetailIconProps {
  size?: number;
}

export default function ProfileDetailIcon({ size = 20 }: ProfileDetailIconProps) {
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon/profile/detail.png')}
        style={[styles.icon, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    width: 25,
    height: 28,
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    // Icon will be sized by the size prop
  },
});
