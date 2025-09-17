import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { X, CircleCheck as CheckCircle, Calendar, ShoppingCart, Users, Flame, Trophy, Clock, CheckCheck, Activity } from 'lucide-react-native';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface NotificationItem {
  id: string;
  type: 'task_completed' | 'shopping_item_completed' | 'member_added' | 'event_created' | 'goal_achieved' | 'system_update' | 'family_milestone';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  user?: {
    name: string;
    avatar_url?: string;
  };
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationIcon = ({ type }: { type: NotificationItem['type'] }) => {
  const iconProps = { size: 18, strokeWidth: 2 };
  
  switch (type) {
    case 'task_completed':
      return <CheckCircle size={18} color="#54FE54" strokeWidth={2} />;
    case 'shopping_item_completed':
      return <ShoppingCart size={18} color="#00D4FF" strokeWidth={2} />;
    case 'member_added':
      return <Users size={18} color="#FFB800" strokeWidth={2} />;
    case 'event_created':
      return <Calendar size={18} color="#FF6B6B" strokeWidth={2} />;
    case 'goal_achieved':
      return <Trophy size={18} color="#9B59B6" strokeWidth={2} />;
    case 'system_update':
      return <Activity size={18} color="#34495E" strokeWidth={2} />;
    case 'family_milestone':
      return <Flame size={18} color="#54FE54" strokeWidth={2} />;
    default:
      return <Activity size={18} color="#666666" strokeWidth={2} />;
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Gerade eben';
  if (diffInMinutes < 60) return `vor ${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `vor ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `vor ${diffInDays}d`;
  
  return time.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
};

export default function NotificationCenter({
  visible,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationCenterProps) {
  const overlayOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(-50);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      modalTranslateY.value = withSpring(0, { damping: 20, stiffness: 150 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 250 });
      modalTranslateY.value = withSpring(-50, { damping: 20, stiffness: 150 });
      modalOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleClose = () => {
    runOnJS(onClose)();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <AnimatedView style={[styles.overlay, overlayAnimatedStyle]}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        
        <AnimatedView style={[styles.modalContainer, modalAnimatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Benachrichtigungen</Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerActions}>
              {hasUnread && (
                <Pressable style={styles.markAllReadButton} onPress={onMarkAllAsRead}>
                  <CheckCheck size={16} color="#54FE54" strokeWidth={2} />
                  <Text style={styles.markAllReadText}>Alle lesen</Text>
                </Pressable>
              )}
              
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <X size={20} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notifications.length > 0 ? (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.unreadNotificationCard
                    ]}
                    onPress={() => onMarkAsRead(notification.id)}
                  >
                    <View style={styles.notificationLeft}>
                      <View style={[
                        styles.notificationIcon,
                        !notification.read && styles.unreadNotificationIcon
                      ]}>
                        <NotificationIcon type={notification.type} />
                      </View>
                      
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.read && styles.unreadNotificationTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTimeAgo(notification.timestamp)}
                        </Text>
                      </View>
                      
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      
                      {notification.user && (
                        <View style={styles.notificationUser}>
                          <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>
                              {notification.user.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.userName}>{notification.user.name}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Activity size={32} color="#E0E0E0" strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Keine Benachrichtigungen</Text>
                <Text style={styles.emptyDescription}>
                  Hier erscheinen Ihre Familienaktivitäten und wichtige Updates
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {notifications.length > 0 && (
            <View style={styles.footer}>
              <Pressable style={styles.footerButton} onPress={handleClose}>
                <Text style={styles.footerButtonText}>Schließen</Text>
              </Pressable>
            </View>
          )}
        </AnimatedView>
      </AnimatedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  unreadBadge: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    maxHeight: screenHeight * 0.5,
  },
  notificationsList: {
    padding: 20,
    gap: 12,
  },

  // Notification Items
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadNotificationCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#54FE54',
    borderWidth: 1,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationLeft: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadNotificationIcon: {
    backgroundColor: 'rgba(84, 254, 84, 0.2)',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54FE54',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  unreadNotificationTitle: {
    color: '#54FE54',
  },
  notificationTime: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Montserrat-Regular',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  userName: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(224, 224, 224, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerButton: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
});