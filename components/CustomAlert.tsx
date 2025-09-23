import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  showCancel?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlert({
  visible,
  type,
  title,
  message,
  onClose,
  showCancel = false,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}: CustomAlertProps) {
  // Animation values
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.3);
  const modalTranslateY = useSharedValue(50);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const iconPulse = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const buttonPulse = useSharedValue(1);

  // Trigger animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      triggerAnimations();
    } else {
      triggerExitAnimations();
    }
  }, [visible]);

  const triggerAnimations = () => {
    // Modal entrance animation
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    modalTranslateY.value = withSpring(0, { damping: 10, stiffness: 100 });

    // Icon animation
    iconScale.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    iconRotation.value = withSpring(360, { damping: 10, stiffness: 100 });

    // Continuous pulse animation
    iconPulse.value = withSequence(
      withTiming(1.1, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    );

    // Button pulse animation
    buttonPulse.value = withSequence(
      withTiming(1.05, { duration: 1500 }),
      withTiming(1, { duration: 1500 })
    );
  };

  const triggerExitAnimations = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.3, { duration: 200 });
    modalTranslateY.value = withTiming(50, { duration: 200 });
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value * iconPulse.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value * buttonPulse.value }
    ],
  }));

  // Get icon and colors based on type
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          backgroundColor: '#4CAF50',
          iconBackgroundColor: '#2E7D32',
          borderColor: '#1B5E20',
        };
      case 'error':
        return {
          icon: '✕',
          backgroundColor: '#F44336',
          iconBackgroundColor: '#C62828',
          borderColor: '#B71C1C',
        };
      case 'warning':
        return {
          icon: '⚠',
          backgroundColor: '#FF9800',
          iconBackgroundColor: '#F57C00',
          borderColor: '#E65100',
        };
      case 'info':
        return {
          icon: 'ℹ',
          backgroundColor: '#2196F3',
          iconBackgroundColor: '#1565C0',
          borderColor: '#0D47A1',
        };
      default:
        return {
          icon: 'ℹ',
          backgroundColor: '#2196F3',
          iconBackgroundColor: '#1565C0',
          borderColor: '#0D47A1',
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { backgroundColor: config.iconBackgroundColor }, iconAnimatedStyle]}>
            <Text style={styles.iconText}>{config.icon}</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <AnimatedPressable
                style={[styles.button, styles.cancelButton, buttonAnimatedStyle]}
                onPress={handleCancel}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </AnimatedPressable>
            )}
            
            <AnimatedPressable
              style={[styles.button, styles.confirmButton, { backgroundColor: config.backgroundColor }, buttonAnimatedStyle]}
              onPress={handleConfirm}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButton: {
    // backgroundColor will be set dynamically
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
