import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withSequence,
  withDelay,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { ChevronRight, Plus } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  onQuickAction?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function FeatureCard({
  title,
  subtitle,
  icon,
  onPress,
  onQuickAction,
  loading = false,
  disabled = false
}: FeatureCardProps) {
  const cardScale = useSharedValue(1);
  const quickActionScale = useSharedValue(1);
  const cardRotation = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { rotate: `${cardRotation.value}deg` }
    ],
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, 0.4]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [4, 16]),
  }));

  const quickActionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: quickActionScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleCardPressIn = () => {
    cardScale.value = withSpring(0.96, { damping: 12, stiffness: 300 });
    cardRotation.value = withSpring(1, { damping: 15, stiffness: 200 });
    iconScale.value = withSpring(1.1, { damping: 10, stiffness: 400 });
    glowIntensity.value = withTiming(1, { duration: 200 });
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, { damping: 20, stiffness: 150 });
    cardRotation.value = withSpring(0, { damping: 15, stiffness: 200 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    glowIntensity.value = withTiming(0, { duration: 300 });
  };

  const handleQuickActionPressIn = () => {
    quickActionScale.value = withSequence(
      withSpring(0.8, { damping: 8, stiffness: 400 }),
      withSpring(1.1, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  };

  const handleQuickActionPressOut = () => {
    // Already handled in press in
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        disabled && styles.disabledContainer,
        cardAnimatedStyle
      ]}
      onPress={onPress}
      onPressIn={handleCardPressIn}
      onPressOut={handleCardPressOut}
      disabled={disabled || loading}
    >
      {/* Main Icon */}
      <Animated.View style={[styles.iconContainer, disabled && styles.disabledIcon, iconAnimatedStyle]}>
        {icon}
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, disabled && styles.disabledTitle]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, disabled && styles.disabledSubtitle]}>
          {loading ? 'Lädt...' : subtitle}
        </Text>
      </View>

      {/* Quick Action Button */}
      {onQuickAction && !disabled && (
        <AnimatedPressable
          style={[styles.quickActionButton, quickActionAnimatedStyle]}
          onPress={(e) => {
            e.stopPropagation();
            onQuickAction();
          }}
          onPressIn={handleQuickActionPressIn}
          onPressOut={handleQuickActionPressOut}
        >
          <Plus size={16} color="#54FE54" strokeWidth={2} />
        </AnimatedPressable>
      )}

      {/* Navigation Arrow */}
      {!disabled && (
        <View style={styles.navigationArrow}>
          <ChevronRight size={20} color="#666666" strokeWidth={2} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    minHeight: 140,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledIcon: {
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  disabledTitle: {
    color: '#999999',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
  },
  disabledSubtitle: {
    color: '#BBBBBB',
  },
  quickActionButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});