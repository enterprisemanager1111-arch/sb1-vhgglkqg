import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Trophy, Star, Target, CircleCheck as CheckCircle, TrendingUp, Gift, Flame, Users, Calendar } from 'lucide-react-native';

const AnimatedView = Animated.createAnimatedComponent(View);
const { width: screenWidth } = Dimensions.get('window');

export interface NotificationData {
  id: string;
  type: 'points_earned' | 'achievement_unlocked' | 'goal_completed' | 'member_activity' | 'streak_bonus';
  title: string;
  message: string;
  points?: number;
  duration?: number;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface NotificationSystemProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

const NotificationIcon = ({ type }: { type: NotificationData['type'] }) => {
  const iconProps = { size: 20, strokeWidth: 2 };
  
  switch (type) {
    case 'points_earned':
      return <Flame size={20} color="#FFFFFF" strokeWidth={2} />;
    case 'achievement_unlocked':
      return <Trophy size={20} color="#FFFFFF" strokeWidth={2} />;
    case 'goal_completed':
      return <Target size={20} color="#FFFFFF" strokeWidth={2} />;
    case 'member_activity':
      return <Users size={20} color="#FFFFFF" strokeWidth={2} />;
    case 'streak_bonus':
      return <Star size={20} color="#FFFFFF" strokeWidth={2} />;
    default:
      return <CheckCircle size={20} color="#FFFFFF" strokeWidth={2} />;
  }
};

const getNotificationStyle = (type: NotificationData['type']) => {
  switch (type) {
    case 'points_earned':
      return {
        backgroundColor: 'rgba(84, 254, 84, 0.95)',
        borderColor: '#54FE54',
      };
    case 'achievement_unlocked':
      return {
        backgroundColor: 'rgba(255, 184, 0, 0.95)',
        borderColor: '#FFB800',
      };
    case 'goal_completed':
      return {
        backgroundColor: 'rgba(52, 199, 89, 0.95)',
        borderColor: '#34C759',
      };
    case 'member_activity':
      return {
        backgroundColor: 'rgba(0, 212, 255, 0.95)',
        borderColor: '#00D4FF',
      };
    case 'streak_bonus':
      return {
        backgroundColor: 'rgba(255, 59, 48, 0.95)',
        borderColor: '#FF3B30',
      };
    default:
      return {
        backgroundColor: 'rgba(84, 254, 84, 0.95)',
        borderColor: '#54FE54',
      };
  }
};

const SingleNotification: React.FC<{
  notification: NotificationData;
  onDismiss: () => void;
  delay: number;
}> = ({ notification, onDismiss, delay }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      
      // Auto dismiss after duration
      const dismissTimer = setTimeout(() => {
        // Animate out
        translateY.value = withSpring(-100, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
        scale.value = withSpring(0.8, { damping: 12, stiffness: 200 });
      }, notification.duration || 4000);
      
      return () => clearTimeout(dismissTimer);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const notificationStyle = getNotificationStyle(notification.type);

  return (
    <AnimatedView style={[
      styles.notification,
      notificationStyle,
      animatedStyle
    ]}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationIcon}>
          <NotificationIcon type={notification.type} />
        </View>
        
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </View>
        
        {notification.points && (
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{notification.points}</Text>
          </View>
        )}
      </View>
    </AnimatedView>
  );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {notifications.map((notification, index) => (
        <SingleNotification
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          delay={index * 200} // Stagger notifications
        />
      ))}
    </View>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random()}`;
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || 4000,
    };

    setNotifications(prev => [...prev, newNotification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showPointsEarned = (points: number, activity: string, userName?: string) => {
    showNotification({
      type: 'points_earned',
      title: `${points} Punkte verdient!`,
      message: userName ? `${userName}: ${activity}` : activity,
      points,
    });
  };

  const showAchievementUnlocked = (title: string, description: string, points: number) => {
    showNotification({
      type: 'achievement_unlocked',
      title: `🏆 ${title}`,
      message: description,
      points,
      duration: 6000,
    });
  };

  const showGoalCompleted = (goalTitle: string) => {
    showNotification({
      type: 'goal_completed',
      title: '🎯 Ziel erreicht!',
      message: goalTitle,
      duration: 5000,
    });
  };

  const showMemberActivity = (memberName: string, activity: string) => {
    showNotification({
      type: 'member_activity',
      title: 'Familienaktivität',
      message: `${memberName} ${activity}`,
    });
  };

  const showStreakBonus = (days: number, points: number) => {
    showNotification({
      type: 'streak_bonus',
      title: `🔥 ${days}-Tage Streak!`,
      message: `Bonus für tägliche Aktivität`,
      points,
      duration: 5000,
    });
  };

  return {
    notifications,
    showNotification,
    dismissNotification,
    showPointsEarned,
    showAchievementUnlocked,
    showGoalCompleted,
    showMemberActivity,
    showStreakBonus,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    gap: 8,
  },
  notification: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    backdropFilter: 'blur(20px)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    opacity: 0.9,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
});

export default NotificationSystem;