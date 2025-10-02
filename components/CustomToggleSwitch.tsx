import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

interface CustomToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function CustomToggleSwitch({ 
  value, 
  onValueChange, 
  disabled = false 
}: CustomToggleSwitchProps) {
  const animatedValue = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = animatedValue.value * 22; // 40 - 18 = 22 (background width - thumb width)
    
    return {
      transform: [{ translateX }],
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      ['#E0E0E0', '#17F196']
    );
    
    return {
      backgroundColor,
    };
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <Pressable
      style={[styles.container, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        <Animated.View style={[styles.thumb, animatedStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container for the entire switch
  },
  background: {
    width: 40,
    height: 18,
    borderRadius: 50, // radius: 50 for rounded rectangle
    justifyContent: 'center',
    paddingHorizontal: 2, // Small padding to prevent thumb from touching edges
  },
  thumb: {
    width: 14,
    height: 14,
    borderRadius: 7, // Perfect circle
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
