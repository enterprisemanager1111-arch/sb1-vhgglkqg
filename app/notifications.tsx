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
  task_id?: string;
  event_id?: string;
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
  event?: {
    title: string;
    description?: string;
    event_date: string;
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
    case 'event':
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
  const assignerName = notification.assigner_profile?.name || 'Someone';
  const taskTitle = notification.task?.title || 'a task';
  const eventTitle = notification.event?.title || 'an event';
  
  const handlePress = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to appropriate page based on notification type
    if (notification.type === 'meeting' || notification.type === 'event') {
      // Navigate to calendar page
      router.push('/(tabs)/calendar');
      
      // Trigger calendar refresh after a short delay to ensure navigation completes
      setTimeout(() => {
        // Dispatch a custom event to trigger calendar refresh
        const refreshEvent = new CustomEvent('refreshCalendar');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(refreshEvent);
        }
      }, 500);
    } else {
      // Navigate to tasks page
      router.push('/(tabs)/tasks');
      
      // Trigger tasks refresh after a short delay to ensure navigation completes
      setTimeout(() => {
        // Dispatch a custom event to trigger tasks refresh
        const refreshEvent = new CustomEvent('refreshTasks');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(refreshEvent);
        }
      }, 500);
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
            {notification.type === 'meeting' || notification.type === 'event' 
              ? 'New Meeting Assigned to You!' 
              : 'New Task Assigned to You!'}
          </Text>
          <Text style={styles.notificationDate}>
            {formatDate(notification.created_at)}
          </Text>
        </View>
        <Text style={styles.notificationDescription}>
          {notification.type === 'meeting' || notification.type === 'event'
            ? `You have a new meeting from ${assignerName}, you can check your meeting "${eventTitle}" by tap here`
            : `You have new task for this sprint from ${assignerName}, you can check your task "${taskTitle}" by tap here`}
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
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  // Reusable fetch function with timeout
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

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Request timeout - please try again');
      }, 10000); // 10 second timeout

      console.log('🔍 Fetching all notifications for user:', user.id);
      
      // First, fetch notifications without joins
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('assignee_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) {
        console.error('❌ Error fetching notifications:', notificationsError);
        setError(notificationsError.message);
        setLoading(false);
        return;
      }

      console.log('📨 Notifications fetched:', notifications);
      console.log('📨 Notifications count:', notifications?.length || 0);

      // If no notifications, set empty array and return
      if (!notifications || notifications.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Fetch assigner profiles for all notifications
      const assignerIds = [...new Set(notifications.map(n => n.assigner_id))];
      const { data: assignerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', assignerIds);

      if (profilesError) {
        console.warn('⚠️ Error fetching assigner profiles:', profilesError);
      }

      // Fetch task details for task notifications
      const taskIds = notifications.filter(n => n.task_id).map(n => n.task_id);
      let taskDetails = [];
      if (taskIds.length > 0) {
        const { data: tasks, error: tasksError } = await supabase
          .from('family_tasks')
          .select('id, title, description')
          .in('id', taskIds);
        
        if (tasksError) {
          console.warn('⚠️ Error fetching task details:', tasksError);
        } else {
          taskDetails = tasks || [];
        }
      }

      // Fetch event details for event notifications
      const eventIds = notifications.filter(n => n.event_id).map(n => n.event_id);
      let eventDetails = [];
      if (eventIds.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('id, title, description, event_date')
          .in('id', eventIds);
        
        if (eventsError) {
          console.warn('⚠️ Error fetching event details:', eventsError);
        } else {
          eventDetails = events || [];
        }
      }

      // Combine all data
      const enrichedNotifications = notifications.map(notification => ({
        ...notification,
        assigner_profile: assignerProfiles?.find(p => p.id === notification.assigner_id),
        task: taskDetails.find(t => t.id === notification.task_id),
        event: eventDetails.find(e => e.id === notification.event_id)
      }));

      console.log('📨 Enriched notifications:', enrichedNotifications);
      setNotifications(enrichedNotifications);

      clearTimeout(timeoutId);
      setError(null);
    } catch (err) {
      console.error('Notification fetch error:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription for notifications
  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time notification subscription for user:', user.id);

    // Clean up existing subscription
    if (realtimeChannel) {
      console.log('🔔 Cleaning up existing subscription');
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `assignee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 New notification received:', payload.new);
          console.log('📨 Current notifications count before adding:', notifications.length);
          
          // Add the new notification to the beginning of the list
          setNotifications(prevNotifications => {
            const newNotification = payload.new as Notification;
            const updatedNotifications = [newNotification, ...prevNotifications];
            console.log('📨 Updated notifications count after adding:', updatedNotifications.length);
            return updatedNotifications;
          });
          
          // Increment new notification count
          setNewNotificationCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `assignee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 Notification updated:', payload.new);
          
          // Update the notification in the list
          setNotifications(prevNotifications => {
            return prevNotifications.map(notification => 
              notification.id === payload.new.id ? payload.new as Notification : notification
            );
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to notifications');
        }
      });

    setRealtimeChannel(channel);
  };

  // Fetch notifications from database and setup real-time subscription
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      setupRealtimeSubscription();
    } else {
      setNotifications([]);
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (realtimeChannel) {
        console.log('🔔 Cleaning up real-time subscription on unmount');
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Refresh notifications when page comes into focus (e.g., after creating a task)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && !loading) {
        const refreshNotifications = async () => {
          try {
            console.log('🔄 Refreshing notifications for user:', user.id);
            
            // Fetch notifications without joins
            const { data: notifications, error: notificationsError } = await supabase
              .from('notifications')
              .select('*')
              .eq('assignee_id', user.id)
              .order('created_at', { ascending: false });

            if (notificationsError) {
              console.error('❌ Error fetching notifications:', notificationsError);
              return;
            }

            console.log('📨 Refreshed notifications:', notifications);
            console.log('📨 Refreshed notifications count:', notifications?.length || 0);

            if (!notifications || notifications.length === 0) {
              setNotifications([]);
              return;
            }

            // Fetch assigner profiles
            const assignerIds = [...new Set(notifications.map(n => n.assigner_id))];
            const { data: assignerProfiles } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', assignerIds);

            // Fetch task details
            const taskIds = notifications.filter(n => n.task_id).map(n => n.task_id);
            let taskDetails = [];
            if (taskIds.length > 0) {
              const { data: tasks } = await supabase
                .from('family_tasks')
                .select('id, title, description')
                .in('id', taskIds);
              taskDetails = tasks || [];
            }

            // Fetch event details
            const eventIds = notifications.filter(n => n.event_id).map(n => n.event_id);
            let eventDetails = [];
            if (eventIds.length > 0) {
              const { data: events } = await supabase
                .from('calendar_events')
                .select('id, title, description, event_date')
                .in('id', eventIds);
              eventDetails = events || [];
            }

            // Combine all data
            const enrichedNotifications = notifications.map(notification => ({
              ...notification,
              assigner_profile: assignerProfiles?.find(p => p.id === notification.assigner_id),
              task: taskDetails.find(t => t.id === notification.task_id),
              event: eventDetails.find(e => e.id === notification.event_id)
            }));

            setNotifications(enrichedNotifications);
          } catch (err) {
            console.error('Notification refresh error:', err);
          }
        };

        refreshNotifications();
        
        // Also refresh real-time subscription when page comes into focus
        setupRealtimeSubscription();
      }
    }, [user?.id, loading])
  );

  // Clear new notification count when component mounts (user is viewing notifications)
  useEffect(() => {
    clearNewNotificationCount();
  }, []);

  // Clear new notification count when user views notifications
  const clearNewNotificationCount = () => {
    setNewNotificationCount(0);
  };

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
            onPress={fetchNotifications}
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {newNotificationCount > 0 && (
            <View style={styles.newNotificationBadge}>
              <Text style={styles.newNotificationBadgeText}>
                {newNotificationCount > 9 ? '9+' : newNotificationCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={clearNewNotificationCount}
      >
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newNotificationBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  newNotificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
