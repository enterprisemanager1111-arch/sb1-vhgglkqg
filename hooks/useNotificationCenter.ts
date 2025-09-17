import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem } from '@/components/NotificationCenter';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

const NOTIFICATIONS_STORAGE_KEY = '@famora_notifications';
const READ_NOTIFICATIONS_KEY = '@famora_read_notifications';

interface UseNotificationCenterReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

export const useNotificationCenter = (): UseNotificationCenterReturn => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const { recentActivities } = useFamilyPoints();
  const { user, profile } = useAuth();
  const { familyMembers } = useFamily();

  // Load read notifications from storage - memoized to prevent recreation
  const loadReadNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      if (stored) {
        const readIds = JSON.parse(stored);
        setReadNotifications(new Set(readIds));
      }
    } catch (error) {
      console.error('Error loading read notifications:', error);
    }
  }, []); // No dependencies needed

  // Save read notifications to storage - memoized to prevent recreation
  const saveReadNotifications = useCallback(async (readIds: Set<string>) => {
    try {
      await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds]));
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  }, []); // No dependencies needed

  // Get activity title - memoized helper function
  const getActivityTitle = useCallback((activityType: string): string => {
    const titles = {
      task_completed: 'Aufgabe erledigt',
      shopping_item_completed: 'Einkauf erledigt',
      member_added: 'Neues Familienmitglied',
      event_created: 'Neuer Termin',
      goal_achieved: 'Ziel erreicht',
      daily_checkin: 'Täglicher Check-in',
      streak_bonus: 'Streak-Bonus',
      family_milestone: 'Familien-Meilenstein',
    };
    
    return titles[activityType as keyof typeof titles] || 'Familienaktivität';
  }, []);

  // Add system notifications - memoized with stable dependencies
  const addSystemNotifications = useCallback((notifications: NotificationItem[], readIds: Set<string>) => {
    // Add welcome message for new users
    if (profile && familyMembers.length <= 1) {
      notifications.push({
        id: 'welcome_message',
        type: 'system_update',
        title: 'Willkommen bei Famora!',
        message: 'Laden Sie Familienmitglieder ein und beginnen Sie mit der gemeinsamen Organisation.',
        timestamp: new Date().toISOString(),
        read: readIds.has('welcome_message'),
      });
    }
    
    // Add family milestone notifications
    if (familyMembers.length >= 2 && !readIds.has('family_complete')) {
      notifications.push({
        id: 'family_complete',
        type: 'family_milestone',
        title: 'Familie ist komplett!',
        message: `Ihre Familie hat jetzt ${familyMembers.length} Mitglieder. Zeit für gemeinsame Aktivitäten!`,
        timestamp: new Date().toISOString(),
        read: readIds.has('family_complete'),
      });
    }
  }, [profile, familyMembers]); // Stable dependencies

  // Convert activities to notifications - properly memoized
  const convertActivitiesToNotifications = useCallback((readIds: Set<string>) => {
    const notifications: NotificationItem[] = [];
    
    // Add recent activities as notifications
    recentActivities.forEach((activity) => {
      const notification: NotificationItem = {
        id: activity.id,
        type: activity.activity_type,
        title: getActivityTitle(activity.activity_type),
        message: activity.description,
        timestamp: activity.created_at,
        read: readIds.has(activity.id),
        user: activity.user_profile ? {
          name: activity.user_profile.name,
          avatar_url: activity.user_profile.avatar_url,
        } : undefined,
        metadata: activity.metadata,
      };
      
      notifications.push(notification);
    });
    
    // Add system notifications
    addSystemNotifications(notifications, readIds);
    
    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit to 15 most recent
    return notifications.slice(0, 15);
  }, [recentActivities, getActivityTitle, addSystemNotifications]); // Properly managed dependencies

  // Load notifications initially - separated from updates
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Load read notifications first
      const stored = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      let readIds = new Set<string>();
      if (stored) {
        const readIdArray = JSON.parse(stored);
        readIds = new Set(readIdArray);
        setReadNotifications(readIds);
      }
      
      // Convert activities with the loaded read state
      const convertedNotifications = convertActivitiesToNotifications(readIds);
      setNotifications(convertedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [convertActivitiesToNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notificationId);
    setReadNotifications(newReadNotifications);
    await saveReadNotifications(newReadNotifications);
    
    // Update notification in state
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, [readNotifications, saveReadNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const allIds = new Set(notifications.map(n => n.id));
    const newReadNotifications = new Set([...readNotifications, ...allIds]);
    setReadNotifications(newReadNotifications);
    await saveReadNotifications(newReadNotifications);
    
    // Update all notifications in state
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, [notifications, readNotifications, saveReadNotifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Initial load - only run once on mount
  useEffect(() => {
    loadNotifications();
  }, []); // Empty dependency array - only run on mount

  // Update notifications when activities change - separate effect
  useEffect(() => {
    if (!loading) { // Only after initial load
      const convertedNotifications = convertActivitiesToNotifications(readNotifications);
      setNotifications(convertedNotifications);
    }
  }, [recentActivities, readNotifications, loading, convertActivitiesToNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
};