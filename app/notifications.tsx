import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  assignee_id: string;
  assigner_id: string;
  task_id: string;
  type: string;
  status: string;
  created_at: string;
  read_at?: string;
  // Joined data
  assigner_profile?: {
    name: string;
    avatar_url?: string;
  };
  task?: {
    title: string;
    description?: string;
  };
}

// Removed mock data - will use real data from database

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task':
      return (
        <Image 
          source={require('@/assets/images/icon/task_image.png')}
          style={styles.notificationIconImage}
          resizeMode="contain"
        />
      );
    case 'expense':
      return (
        <Image 
          source={require('@/assets/images/icon/task_image.png')}
          style={styles.notificationIconImage}
          resizeMode="contain"
        />
      );
    case 'meeting':
      return (
        <Image 
          source={require('@/assets/images/icon/meeting_image.png')}
          style={styles.notificationIconImage}
          resizeMode="contain"
        />
      );
    default:
      return (
        <Image 
          source={require('@/assets/images/icon/task_image.png')}
          style={styles.notificationIconImage}
          resizeMode="contain"
        />
      );
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const isUnread = notification.status === 'unread';
  const assignerName = 'Someone'; // Will be updated when we have proper joins
  const taskTitle = 'a task'; // Will be updated when we have proper joins
  
  const handlePress = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Pressable 
      style={styles.notificationItem}
      onPress={handlePress}
    >
      <View style={styles.notificationIconContainer}>
        {getNotificationIcon(notification.type)}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>
            New Task Assigned to You!
          </Text>
          <Text style={styles.notificationDate}>
            {formatDate(notification.created_at)}
          </Text>
        </View>
        <Text style={styles.notificationDescription}>
          You have new task for this sprint from {assignerName}, you can check your task "{taskTitle}" by tap here
        </Text>
      </View>
    </Pressable>
  );
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        setLoading(false);
        setError(null);
        setNotifications([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        const fetchPromise = supabase
          .from('notifications')
          .select('*')
          .eq('assignee_id', user.id)
          .order('created_at', { ascending: false });

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const { data, error } = result;

        if (error) {
          if (error.code === 'PGRST205') {
            // Table doesn't exist yet, show empty state instead of error
            setNotifications([]);
            setError(null);
          } else {
            setError('Failed to load notifications');
            setNotifications([]);
          }
        } else {
          setNotifications(data || []);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Refresh notifications when page comes into focus (e.g., after creating a task)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        const refreshNotifications = async () => {
          try {
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('assignee_id', user.id)
              .order('created_at', { ascending: false });

            if (!error) {
              setNotifications(data || []);
            }
          } catch (err) {
            // Silent error handling
          }
        };

        refreshNotifications();
      }
    }, [user?.id])
  );

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (!error) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 'read', read_at: new Date().toISOString() }
              : notification
          )
        );
      }
    } catch (err) {
      // Silent error handling
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image 
              source={require('@/assets/images/icon/arrow-left.svg')}
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Image 
              source={require('@/assets/images/icon/arrow-left.svg')}
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Trigger a re-fetch by updating the dependency
              window.location.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Image 
            source={require('@/assets/images/icon/arrow-left.svg')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>You'll see task assignments here</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    // paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationIconImage: {
    width: 64,
    height: 64,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#101828',
    flex: 1,
    marginRight: 8,
  },
  notificationDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#101828',
  },
  notificationDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#667085',
    // lineHeight: 18,
    letterSpacing: -0.2,
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
