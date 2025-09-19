import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withTiming, 
  useAnimatedStyle,
  runOnJS,
  withSequence,
  withDelay,
  interpolate,
  withRepeat
} from 'react-native-reanimated';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function Snackbar({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  action
}: SnackbarProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(-10);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animation with impressive entrance
      translateY.value = withSequence(
        withSpring(-50, { damping: 15, stiffness: 200 }),
        withSpring(0, { damping: 20, stiffness: 300 })
      );
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSequence(
        withSpring(0.9, { damping: 12, stiffness: 300 }),
        withSpring(1.05, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 20, stiffness: 150 })
      );
      rotation.value = withSpring(0, { damping: 15, stiffness: 200 });
      glowIntensity.value = withTiming(1, { duration: 500 });

      // Auto dismiss
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      dismiss();
    }
  }, [visible, duration]);

  const dismiss = () => {
    translateY.value = withSpring(-100, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withSpring(0.8, { damping: 15, stiffness: 200 });
    rotation.value = withSpring(-10, { damping: 15, stiffness: 200 });
    glowIntensity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, 0.4]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [4, 16]),
  }));

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" strokeWidth={2} />;
      case 'error':
        return <XCircle size={20} color="#EF4444" strokeWidth={2} />;
      case 'warning':
        return <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />;
      case 'info':
      default:
        return <Info size={20} color="#3B82F6" strokeWidth={2} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#ECFDF5';
      case 'error':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      case 'info':
      default:
        return '#EFF6FF';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[
        styles.snackbar,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
        }
      ]}>
        <View style={styles.content}>
          <View style={styles.leftContent}>
            {getIcon()}
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.rightContent}>
            {action && (
              <Text 
                style={[styles.actionText, { color: getBorderColor() }]}
                onPress={action.onPress}
              >
                {action.label}
              </Text>
            )}
            <X 
              size={18} 
              color="#6B7280" 
              strokeWidth={2} 
              onPress={dismiss}
              style={styles.dismissIcon}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  snackbar: {
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    textDecorationLine: 'underline',
  },
  dismissIcon: {
    padding: 4,
  },
});
