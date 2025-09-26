import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  onFinish?: () => void;
}

export default function SplashScreen({ onAnimationComplete, onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Simple delay before finishing
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      } else if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#17f196" />
      
      {/* Logo Image */}
      <Image 
        source={require('@/assets/images/newImg/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
});