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
  const alertOpacity = useSharedValue(0);
  const alertTranslateY = useSharedValue(-100); // Start higher for top positioning
  const progressWidth = useSharedValue(0); // Start at 0% (empty)
  const [timeLeft, setTimeLeft] = React.useState(1.5);

  // Trigger animations when alert becomes visible
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    if (visible) {
      triggerAnimations();
      intervalId = startCountdown();
    } else {
      triggerExitAnimations();
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [visible]);

  const startCountdown = () => {
    setTimeLeft(1.5);
    
    // Timeline countdown animation (1.5 seconds) - goes from 0% to 100%
    progressWidth.value = withTiming(1, { duration: 1500 });
    
    // Update time left every 0.1 seconds for smoother countdown
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          // Auto-close after 1.5 seconds
          setTimeout(() => {
            onClose();
          }, 100);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return interval;
  };

  const triggerAnimations = () => {
    // Alert entrance animation - slides down from top
    alertOpacity.value = withTiming(1, { duration: 300 });
    alertTranslateY.value = withSpring(0, { damping: 12, stiffness: 120 });
  };

  const triggerExitAnimations = () => {
    alertOpacity.value = withTiming(0, { duration: 200 });
    alertTranslateY.value = withTiming(-100, { duration: 200 });
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

  // Animated styles
  const alertAnimatedStyle = useAnimatedStyle(() => ({
    opacity: alertOpacity.value,
    transform: [{ translateY: alertTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // Get icon and colors based on type
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          iconBackgroundColor: '#4CAF50',
          progressColor: '#4CAF50',
        };
      case 'error':
        return {
          icon: '✕',
          iconBackgroundColor: '#F44336',
          progressColor: '#F44336',
        };
      case 'warning':
        return {
          icon: '⚠',
          iconBackgroundColor: '#FF9800',
          progressColor: '#FF9800',
        };
      case 'info':
        return {
          icon: 'ℹ',
          iconBackgroundColor: '#2196F3',
          progressColor: '#2196F3',
        };
      default:
        return {
          icon: 'ℹ',
          iconBackgroundColor: '#2196F3',
          progressColor: '#2196F3',
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
        <Animated.View style={[styles.alertContainer, alertAnimatedStyle]}>
          {/* Alert Card */}
          <View style={styles.alertCard}>
            {/* Icon and Content Row */}
            <View style={styles.contentRow}>
              {/* Status Icon */}
              <View style={[styles.statusIcon, { backgroundColor: config.iconBackgroundColor }]}>
                <Text style={styles.iconText}>{config.icon}</Text>
              </View>

              {/* Text Content */}
              <View style={styles.textContent}>
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertMessage}>{message}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { backgroundColor: config.progressColor },
                  progressAnimatedStyle
                ]} 
              />
            </View>

            {/* Action Buttons */}
            {(showCancel || onConfirm) && (
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <Pressable style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </Pressable>
                )}
                
                {onConfirm && (
                  <Pressable 
                    style={[styles.confirmButton, { backgroundColor: config.iconBackgroundColor }]} 
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80, // Position from top of screen (accounting for status bar)
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  iconText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
});
