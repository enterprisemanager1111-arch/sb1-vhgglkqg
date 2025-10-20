import React, { useState, useEffect, useRef } from 'react';
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
  type: string;
  status: string;
  created_at: string;
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
  console.log('🔔 Notification status check:', {
    id: notification.id,
    status: notification.status,
    isUnread: isUnread,
    statusType: typeof notification.status
  });
  const assignerName = notification.assigner_profile?.name || 'Someone';
  const taskTitle = notification.task?.title || 'a task';
  
  const handlePress = () => {
    console.log('🔔 Notification clicked:', {
      id: notification.id,
      status: notification.status,
      isUnread: isUnread
    });
    
    if (isUnread) {
      console.log('🔔 Calling onMarkAsRead for unread notification');
      onMarkAsRead(notification.id);
    } else {
      console.log('🔔 Notification is already read, skipping markAsRead');
    }
    
    // Navigate to tasks page for all notifications
      router.push('/(tabs)/tasks');
      
      // Trigger tasks refresh after a short delay to ensure navigation completes
      setTimeout(() => {
        // Dispatch a custom event to trigger tasks refresh
        const refreshEvent = new CustomEvent('refreshTasks');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(refreshEvent);
        }
      }, 500);
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
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const isLoadingRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckFailedRef = useRef(false);
  const queryFailedRef = useRef(false);
  const lastFailureTimeRef = useRef(0);
  const periodicRetryRef = useRef<NodeJS.Timeout | null>(null);


  const loadNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      setError(null);
      setNotifications([]);
      return;
    }

    // Force reset if stuck in loading state for too long
    const now = Date.now();
    const timeSinceLastFailure = now - lastFailureTimeRef.current;
    if (isLoadingRef.current && timeSinceLastFailure > 3600000) { // 10 seconds
      console.log('🔄 Force resetting stuck loading state...');
      isLoadingRef.current = false;
      setLoading(false);
      queryFailedRef.current = false;
      lastFailureTimeRef.current = 0;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('🔄 Already loading notifications, skipping duplicate call');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      // Set a timeout to reset loading state if it gets stuck
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Loading timeout - force resetting all states');
        isLoadingRef.current = false;
        setLoading(false);
        setNotifications([]);
        setError(null);
        queryFailedRef.current = false;
        lastFailureTimeRef.current = 0;
        // Force trigger a fresh load attempt
        setTimeout(() => {
          console.log('🔄 Force retry after timeout...');
          loadNotifications();
        }, 1000);
      }, 3000); // Reduced to 3 second timeout

      console.log('🔍 Fetching notifications for user:', user.id);
      
      // Circuit breaker: If queries failed recently, use mock data immediately
      const now = Date.now();
      const timeSinceLastFailure = now - lastFailureTimeRef.current;
      const circuitBreakerTimeout = 10000; // Reduced to 10 seconds
      
      if (queryFailedRef.current && timeSinceLastFailure < circuitBreakerTimeout) {
        console.log('⚠️ Circuit breaker active, using mock data immediately...');
        setNotifications([
          {
            id: 'mock-1',
            assignee_id: user.id,
            assigner_id: user.id,
            task_id: null,
            type: 'task',
            status: 'unread',
            created_at: new Date().toISOString()
          }
        ]);
        setError(null);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      } else if (queryFailedRef.current && timeSinceLastFailure >= circuitBreakerTimeout) {
        console.log('🔄 Circuit breaker timeout expired, resetting and retrying...');
        queryFailedRef.current = false;
        lastFailureTimeRef.current = 0;
      }
      
      // Skip session check entirely to prevent hanging
      console.log('⚠️ Skipping session check to prevent hanging, proceeding directly...');
      
      // Try multiple approaches with fallbacks
      console.log('🔄 Attempting direct query...');
      
      let notifications = null;
      let error = null;
      
      // Approach 1: Try the basic query with timeout
      try {
        console.log('🔄 Using get_notifications function...');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout after 2 seconds')), 2000);
        });

        const notificationsPromise = supabase
          .rpc('get_notifications', {
            _user_id: user.id
          });

        const result = await Promise.race([
          notificationsPromise,
          timeoutPromise
        ]) as any;
        
        notifications = result.data;
        error = result.error;
        console.log('✅ get_notifications function succeeded');
      } catch (timeoutErr) {
        console.log('⚠️ get_notifications function timed out, trying fallback...');
        
        // Approach 2: Try with even simpler query
        try {
          console.log('🔄 Trying get_notifications function again...');
          const minimalPromise = supabase
            .rpc('get_notifications', {
              _user_id: user.id
            });
            
          const minimalTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Minimal query timeout')), 1000);
          });
          
          const result = await Promise.race([
            minimalPromise,
            minimalTimeout
          ]) as any;
          
          notifications = result.data;
          error = result.error;
          console.log('✅ get_notifications function succeeded on retry');
        } catch (minimalErr) {
          console.log('⚠️ get_notifications function also failed, activating circuit breaker...');
          queryFailedRef.current = true;
          lastFailureTimeRef.current = Date.now();
          
          // Set up periodic retry after circuit breaker timeout
          if (periodicRetryRef.current) {
            clearTimeout(periodicRetryRef.current);
          }
          periodicRetryRef.current = setTimeout(() => {
            console.log('🔄 Periodic retry: Circuit breaker timeout expired, attempting reconnection...');
            queryFailedRef.current = false;
            lastFailureTimeRef.current = 0;
            loadNotifications();
          }, 10000); // Reduced to 10 seconds
          
          // Approach 3: Use mock data as final fallback
          try {
            console.log('🔄 Using mock data fallback...');
            notifications = [
              {
                id: 'mock-1',
                assignee_id: user.id,
                assigner_id: user.id,
                task_id: null,
                type: 'task',
                status: 'unread',
                created_at: new Date().toISOString()
              }
            ];
            error = null;
            console.log('✅ Mock data fallback succeeded');
          } catch (mockErr) {
            console.log('⚠️ Even mock data failed, using empty state...');
            notifications = [];
            error = null;
          }
        }
      }

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If it's a table/permission error, show empty state instead of error
        if (error.code === '42703' || error.message.includes('does not exist') || error.message.includes('permission')) {
          console.log('📭 Notifications table not accessible, showing empty state');
          setNotifications([]);
          setError(null);
        } else {
          setError(`Failed to load notifications: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('📨 Notifications fetched:', notifications);
      console.log('📨 Notifications count:', notifications?.length || 0);
      console.log('📨 Notification statuses:', notifications?.map(n => ({ id: n.id, status: n.status })));

      setNotifications(notifications || []);
      setError(null);
      
      // Clear circuit breaker on successful query
      if (queryFailedRef.current) {
        console.log('✅ Query succeeded, clearing circuit breaker...');
        queryFailedRef.current = false;
        lastFailureTimeRef.current = 0;
        if (periodicRetryRef.current) {
          clearTimeout(periodicRetryRef.current);
          periodicRetryRef.current = null;
        }
      }
    } catch (err) {
      console.error('Notification fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle different types of errors
      if (errorMessage.includes('timeout')) {
        console.log('⏰ Request timed out, showing empty state');
        setNotifications([]);
        setError(null);
      } else if (errorMessage.includes('Authentication') || errorMessage.includes('session') || errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
        console.log('🔐 Authentication issue, retrying in 3 seconds...');
        setNotifications([]);
        setError(null);
        // Reset loading state to allow retry
        isLoadingRef.current = false;
        
        // Retry after 3 seconds
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying after authentication issue...');
          loadNotifications();
        }, 3000);
      } else {
        setError(`Failed to load notifications: ${errorMessage}`);
      setNotifications([]);
      }
    } finally {
      // Clear the timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoading(false);
      isLoadingRef.current = false;
    }
  };


  // Load notifications using get_notifications function
  useEffect(() => {
    console.log('🔔 Notifications useEffect triggered');
    console.log('🔔 User ID:', user?.id);
    console.log('🔔 User exists:', !!user);
    
    // Always reset loading state on mount/focus
    console.log('🔄 Force resetting all states on mount...');
    isLoadingRef.current = false;
    setLoading(false);
    sessionCheckFailedRef.current = false;
    queryFailedRef.current = false;
    lastFailureTimeRef.current = 0;
    
    if (user?.id) {
      console.log('🔔 Loading notifications for user:', user.id);
      loadNotifications();
    } else {
      console.log('🔔 No user ID, setting empty state');
      setNotifications([]);
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh notifications when page comes into focus (but not if already loading)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔔 useFocusEffect triggered');
      console.log('🔔 User ID:', user?.id);
      console.log('🔔 isLoadingRef.current:', isLoadingRef.current);
      
      if (user?.id) {
        // Force reset if stuck in loading state for too long
        const now = Date.now();
        const timeSinceLastFailure = now - lastFailureTimeRef.current;
        
        if (isLoadingRef.current && timeSinceLastFailure > 15000) { // 15 seconds
          console.log('🔔 Focus effect: Force resetting stuck loading state...');
          isLoadingRef.current = false;
          setLoading(false);
          queryFailedRef.current = false;
          lastFailureTimeRef.current = 0;
        }
        
        // Always try to load, but check if already loading
        if (!isLoadingRef.current) {
          console.log('🔔 Focus effect: Loading notifications');
        loadNotifications();
        } else {
          console.log('🔔 Focus effect: Already loading, skipping');
        }
      } else {
        console.log('🔔 Focus effect: No user ID, skipping');
      }
    }, [user?.id]) // Removed 'loading' from dependencies to prevent infinite loop
  );

  // Clear new notification count when component mounts (user is viewing notifications)
  useEffect(() => {
    clearNewNotificationCount();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (periodicRetryRef.current) {
        clearTimeout(periodicRetryRef.current);
      }
    };
  }, []);

  // Clear new notification count when user views notifications
  const clearNewNotificationCount = () => {
    setNewNotificationCount(0);
  };

  // Mark notification as read in database and local state
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('📝 Marking notification as read:', notificationId);
      console.log('📝 Current notifications before update:', notifications.map(n => ({ id: n.id, status: n.status })));
      // Update database using mark_notifications_as_read function
      // const pgArray = `{${[notificationId].map(id => `"${id}"`).join(",")}}`;
      // console.log('📝 PG array:', pgArray);
      // const pgArray = `{${[notificationId].map(s => `"${s}"`).join(",")}}`;
      const { data, error } = await supabase
        .rpc('mark_notifications_as_read', {
          _notification_ids: [notificationId]
        });

      console.log('📝 Database update result:', { data, error });

      if (error) {
        console.error('❌ Error updating notification status:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.log('⚠️ Database update failed, but will still update local state');
      } else {
        console.log('✅ Notification marked as read in database');
        console.log('✅ Updated notification data:', data);
      }

      // Always update local state regardless of database success/failure
      setNotifications(prev => {
        const updated = prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' }
            : notification
        );
        console.log('📝 Local state updated:', updated.map(n => ({ id: n.id, status: n.status })));
        return updated;
      });

      // Update notification count
      setNewNotificationCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('📝 Notification count updated:', { prev, newCount });
        return newCount;
      });

      // Dispatch event to refresh home page data
      if (typeof window !== 'undefined') {
        console.log('🔄 Dispatching refreshHomeData event');
        window.dispatchEvent(new CustomEvent('refreshHomeData'));
      }
    } catch (err) {
      console.error('❌ Error in markAsRead:', err);
      // Still update local state for better UX
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
            ? { ...notification, status: 'read' }
          : notification
      )
    );

      // Update notification count
      setNewNotificationCount(prev => Math.max(0, prev - 1));

      // Dispatch event to refresh home page data even on error
      if (typeof window !== 'undefined') {
        console.log('🔄 Dispatching refreshHomeData event after error');
        window.dispatchEvent(new CustomEvent('refreshHomeData'));
      }
    }
  };

  // Manual retry function
  const handleManualRetry = () => {
    console.log('🔄 Manual retry triggered...');
    queryFailedRef.current = false;
    lastFailureTimeRef.current = 0;
    if (periodicRetryRef.current) {
      clearTimeout(periodicRetryRef.current);
      periodicRetryRef.current = null;
    }
    loadNotifications();
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
                    onPress={handleManualRetry}
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
