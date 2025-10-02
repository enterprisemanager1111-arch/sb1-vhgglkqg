import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface ProfileDetailIconProps {
  size?: number;
}

export default function ProfileDetailIcon({ size = 20 }: ProfileDetailIconProps) {
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

const styles = StyleSheet.create({
  container: {
    width: 25,
    height: 28,
    flexShrink: 0,
    borderRadius: 3,
    backgroundColor: '#EAECF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    // Icon will be sized by the size prop
  },
});
