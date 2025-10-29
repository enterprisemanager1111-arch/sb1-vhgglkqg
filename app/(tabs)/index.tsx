import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  SafeAreaView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
// Removed unused lucide-react-native imports
import { useAuth } from '@/contexts/AuthContext';
// Removed useFamily import
import { useLoading } from '@/contexts/LoadingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { router } from 'expo-router';
import { getTheme, brandColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useCurrentUserEvents } from '@/hooks/useCurrentUserEvents';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useTodayShoppingItems } from '@/hooks/useTodayShoppingItems';
// Removed unused imports

// Custom verification icon component
const VerificationIcon = ({ size = 16 }: { size?: number }) => (
  <Image
    source={require('@/assets/images/icon/verification.png')}
    style={{
      width: size,
      height: size,
      resizeMode: 'contain'
    }}
  />
);

export default function HomeDashboard() {
  const { user, profile, session, refreshProfile, updateProfileDirectly } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  // Removed directProfileData - home page should only use centralized state
  
  // Get current user's events for today
  const { events: todayEvents, loading: eventsLoading, error: eventsError, refreshEvents } = useCurrentUserEvents();
  
  // Get today's tasks using the specialized function
  const { tasks: todayTasks, loading: tasksLoading, error: tasksError, refreshTasks } = useTodayTasks();
  
  // Get today's shopping items
  const { items: todayShoppingItems, loading: shoppingLoading, error: shoppingError, refreshItems: refreshShoppingItems } = useTodayShoppingItems();
  
  // Debug today's tasks
  console.log('🏠 Home page - todayTasks:', todayTasks);
  console.log('🏠 Home page - tasksLoading:', tasksLoading);
  console.log('🏠 Home page - tasksError:', tasksError);
  console.log('🏠 Home page - todayTasks.length:', todayTasks?.length || 0);
  
  // Debug today's shopping items
  console.log('🏠 Home page - todayShoppingItems:', todayShoppingItems);
  console.log('🏠 Home page - shoppingLoading:', shoppingLoading);
  console.log('🏠 Home page - shoppingError:', shoppingError);
  console.log('🏠 Home page - todayShoppingItems.length:', todayShoppingItems?.length || 0);

  // Helper function to format event time
  const formatEventTime = (eventDate: string, endDate?: string) => {
    const start = new Date(eventDate);
    const end = endDate ? new Date(endDate) : null;
    
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (end) {
      const endTime = end.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }
    
    return startTime;
  };

  // Today's tasks are now fetched directly from the specialized function
  
  // Function to process uncompleted family items
  const processUncompletedFamilyItems = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Processing uncompleted family items...');
      const { data, error } = await supabase.rpc('process_uncompleted_family_items');
      
      if (error) {
        console.error('❌ Error processing uncompleted family items:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log('✅ Processed uncompleted family items:', {
          tasks: result.processed_tasks,
          events: result.processed_events,
          shoppingItems: result.processed_shopping_items,
          success: result.success,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Error calling process_uncompleted_family_items:', error);
    }
  };

  // Function to fetch initial notification count
  const fetchNotificationCount = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('assignee_id', user.id)
        .eq('status', 'unread');
      
      if (!error && data) {
        setNotificationCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Setup real-time subscription for notifications
  const setupNotificationSubscription = () => {
    if (!user?.id) return;

    // Clean up existing subscription
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel('home-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `assignee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification received on home page:', payload.new);
          setNotificationCount(prev => prev + 1);
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
          console.log('🔔 Notification updated on home page:', payload.new);
          // If notification was marked as read, decrease count
          if (payload.new.status === 'read') {
            setNotificationCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        console.log('🔔 Custom notification event received:', payload);
        if (payload.user_id === user.id) {
          setNotificationCount(prev => prev + 1);
        }
      })
      .on('broadcast', { event: 'notification_read' }, (payload) => {
        console.log('🔔 Custom notification read event received:', payload);
        if (payload.user_id === user.id) {
          setNotificationCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    setRealtimeChannel(channel);
  };
  
  // Removed directProfileData monitoring - home page should only use centralized state
  
  // Initialize notification system when user is available
  useEffect(() => {
    if (user?.id) {
      fetchNotificationCount();
      setupNotificationSubscription();
      processUncompletedFamilyItems(); // Process uncompleted family items on home page load
    }
    
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Refresh notification count when user focuses on home page
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchNotificationCount();
      }
    }, [user?.id])
  );

  // Component mount check with direct database query to get current profile data
  useEffect(() => {
    console.log('🔄 Component mounted - checking user and profile state...');
    console.log('🔄 User available:', !!user);
    console.log('🔄 User ID:', user?.id);
    console.log('🔄 Profile available:', !!profile);
    console.log('🔄 Profile name:', profile?.name);
    console.log('🔄 Profile avatar_url:', profile?.avatar_url);
    console.log('🔄 Profile role:', profile?.role);
    
    if (user && profile) {
      console.log('✅ User and profile available - checking if profile data is current...');
      console.log('🔍 Profile name from centralized state:', profile.name);
      console.log('🔍 Profile name is empty?', !profile.name || profile.name.trim() === '');
      console.log('🔍 Profile name is email-based?', profile.name && profile.name.includes('@'));
      
      // If profile has email-based name, try to get current data from database
      const isEmailBasedName = profile.name && 
                              (profile.name.includes('@') || 
                               profile.name === user?.email?.split('@')[0] ||
                               profile.name.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase());
      
      if (isEmailBasedName) {
        console.log('⚠️ Profile has email-based name, fetching current data from database...');
        
        // Direct database query to get current profile data
        const fetchCurrentProfile = async () => {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('✅ Direct database query successful:', data);
              
              if (data && data.length > 0) {
                const currentProfile = data[0];
                console.log('✅ Current profile from database:', currentProfile);
                console.log('✅ Current profile name:', currentProfile.name);
                console.log('✅ Current profile avatar_url:', currentProfile.avatar_url);
                console.log('✅ Current profile role:', currentProfile.role);
                
                // Update the centralized state with the current profile data
                if (updateProfileDirectly) {
                  updateProfileDirectly(currentProfile);
                  console.log('✅ AuthContext updated with current profile from database');
                }
              }
            }
          } catch (error) {
            console.log('⚠️ Direct database query failed:', error);
          }
        };
        
        fetchCurrentProfile();
      }
    } else if (user && !profile) {
      console.log('⚠️ User available but profile missing - will be loaded by AuthContext');
    } else {
      console.log('⚠️ No user available on component mount');
    }
  }, [user, profile, updateProfileDirectly]);

  // No fallback API calls - home page should only use existing profile data

  // No immediate profile checks - home page should only use existing profile data
  
  // Show loading interface while initial data is being loaded
  useEffect(() => {
    if (isInitialLoading && !loadingStarted) {
      setLoadingStarted(true);
      showLoading(t('home.loading.dashboard'));
      
      // Force loading to end after maximum 10 seconds regardless of API status
      const forceEndLoading = setTimeout(() => {
        console.log('⚠️ Force ending loading after 10 seconds');
        setIsInitialLoading(false);
        hideLoading();
      }, 10000);
      
      // Cleanup timeout when component unmounts or loading ends
      return () => clearTimeout(forceEndLoading);
    }
  }, [isInitialLoading, loadingStarted, showLoading, hideLoading]);

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitialLoading) {
        console.log('⚠️ Initial loading timeout, forcing completion');
        setIsInitialLoading(false);
        hideLoading();
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitialLoading, hideLoading]);

  // Check if initial loading is complete
  useEffect(() => {
    const checkInitialLoading = () => {
      // Check if we have essential data loaded
      const hasUser = !!user;
      const hasProfile = !!profile;

      // Only hide loading when essential data is loaded
      if (hasUser && hasProfile) {
        // Add a small delay to ensure loading interface is visible
        setTimeout(() => {
          setIsInitialLoading(false);
          hideLoading();
        }, 500); // 500ms minimum loading time
      }
    };

    checkInitialLoading();
  }, [user, profile, hideLoading]);

  // Listen for refresh events from notifications
  useEffect(() => {
    const handleRefreshHomeData = () => {
      console.log('🔄 Home page refresh triggered from notification');
      refreshEvents();
      refreshTasks();
      refreshShoppingItems();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('refreshHomeData', handleRefreshHomeData);
      
      return () => {
        window.removeEventListener('refreshHomeData', handleRefreshHomeData);
      };
    }
  }, [refreshEvents, refreshTasks, refreshShoppingItems]);

  // Focus effect with direct database query to get current profile data
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 Home page focused, checking profile data...');
      console.log('🏠 Current profile data:', profile);
      console.log('🏠 Profile name:', profile?.name);
      console.log('🏠 Profile avatar_url:', profile?.avatar_url);
      console.log('🏠 Profile role:', profile?.role);
      
      if (user && profile) {
        console.log('✅ User and profile available - checking if profile data is current...');
        console.log('🔍 Profile name from centralized state:', profile.name);
        console.log('🔍 Profile name is empty?', !profile.name || profile.name.trim() === '');
        console.log('🔍 Profile name is email-based?', profile.name && profile.name.includes('@'));
        
        // If profile has email-based name, try to get current data from database
        const isEmailBasedName = profile.name && 
                                (profile.name.includes('@') || 
                                 profile.name === user?.email?.split('@')[0] ||
                                 profile.name.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase());
        
        if (isEmailBasedName) {
          console.log('⚠️ Profile has email-based name, fetching current data from database...');
          
          // Direct database query to get current profile data
          const fetchCurrentProfile = async () => {
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`,
                  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('✅ Direct database query successful:', data);
                
                if (data && data.length > 0) {
                  const currentProfile = data[0];
                  console.log('✅ Current profile from database:', currentProfile);
                  console.log('✅ Current profile name:', currentProfile.name);
                  console.log('✅ Current profile avatar_url:', currentProfile.avatar_url);
                  console.log('✅ Current profile role:', currentProfile.role);
                  
                  // Update the centralized state with the current profile data
                  if (updateProfileDirectly) {
                    updateProfileDirectly(currentProfile);
                    console.log('✅ AuthContext updated with current profile from database');
                  }
                }
              }
            } catch (error) {
              console.log('⚠️ Direct database query failed:', error);
            }
          };
          
          fetchCurrentProfile();
        }
      } else if (user && !profile) {
        console.log('⚠️ User available but profile missing - will be loaded by AuthContext');
        } else {
        console.log('⚠️ No user available for profile check');
      }
    }, [user, profile, updateProfileDirectly, session])
  );

  // Removed family-related API calls and dependencies

  // Removed real-time subscription for notifications

  // Use profile from AuthContext (centralized state like Redux) only
  const currentProfile = profile;
  console.log('🏠 Home page - Profile from centralized state:', profile);
  console.log('🏠 Home page - Using profile:', currentProfile);
  console.log('🏠 Home page - Profile name:', currentProfile?.name);
  console.log('🏠 Home page - Profile avatar_url:', currentProfile?.avatar_url);
  console.log('🏠 Home page - Profile role:', currentProfile?.role);
  console.log('🏠 Home page - User metadata:', user?.user_metadata);
  console.log('🏠 Home page - User email:', user?.email);

  // Removed task-related functions - using mock data instead

  // Extract full name for greeting from centralized state
  const userName = (() => {
    console.log('🔍 userName function - currentProfile:', currentProfile);
    console.log('🔍 userName function - currentProfile?.name:', currentProfile?.name);
    console.log('🔍 userName function - currentProfile?.name?.trim():', currentProfile?.name?.trim());
    console.log('🔍 userName function - currentProfile?.name?.trim() length:', currentProfile?.name?.trim()?.length);
    console.log('🔍 userName function - currentProfile?.name type:', typeof currentProfile?.name);
    console.log('🔍 userName function - currentProfile?.name is empty string?', currentProfile?.name === '');
    console.log('🔍 userName function - currentProfile?.name is null?', currentProfile?.name === null);
    console.log('🔍 userName function - currentProfile?.name is undefined?', currentProfile?.name === undefined);
    
    // Check if profile name is valid (not empty, not email-based)
    const isEmailBasedName = currentProfile?.name && 
                             (currentProfile.name.includes('@') || 
                              currentProfile.name === user?.email?.split('@')[0] ||
                              currentProfile.name.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase());
    
    console.log('🔍 userName function - isEmailBasedName:', isEmailBasedName);
    
    if (currentProfile?.name && currentProfile.name.trim() && !isEmailBasedName) {
      console.log('✅ Using profile name from centralized state:', currentProfile.name);
      return currentProfile.name.trim();
    }
    
    if (isEmailBasedName) {
      console.log('⚠️ Profile name is email-based, trying to get better name...');
      console.log('🔍 Checking for better name sources...');
      console.log('🔍 user.user_metadata.full_name:', user?.user_metadata?.full_name);
      console.log('🔍 user.user_metadata.name:', user?.user_metadata?.name);
      console.log('🔍 user.user_metadata.first_name:', user?.user_metadata?.first_name);
      console.log('🔍 user.user_metadata.last_name:', user?.user_metadata?.last_name);
      console.log('🔍 user.app_metadata.full_name:', user?.app_metadata?.full_name);
      console.log('🔍 user.app_metadata.name:', user?.app_metadata?.name);
    }
    
    if (user?.user_metadata?.full_name && user.user_metadata.full_name.trim()) {
      console.log('✅ Using user metadata full_name:', user.user_metadata.full_name);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: user.user_metadata.full_name.trim(),
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from user metadata');
      }
      return user.user_metadata.full_name.trim();
    }
    if (user?.user_metadata?.name && user.user_metadata.name.trim()) {
      console.log('✅ Using user metadata name:', user.user_metadata.name);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: user.user_metadata.name.trim(),
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from user metadata');
      }
      return user.user_metadata.name.trim();
    }
    // Try first_name + last_name combination
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      const fullName = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim();
      console.log('✅ Using first_name + last_name:', fullName);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: fullName,
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from first_name + last_name');
      }
      return fullName;
    }
    if (user?.user_metadata?.first_name && user.user_metadata.first_name.trim()) {
      console.log('✅ Using user metadata first_name:', user.user_metadata.first_name);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: user.user_metadata.first_name.trim(),
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from first_name');
      }
      return user.user_metadata.first_name.trim();
    }
    if (user?.app_metadata?.full_name && user.app_metadata.full_name.trim()) {
      console.log('✅ Using app metadata full_name:', user.app_metadata.full_name);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: user.app_metadata.full_name.trim(),
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from app metadata');
      }
      return user.app_metadata.full_name.trim();
    }
    if (user?.app_metadata?.name && user.app_metadata.name.trim()) {
      console.log('✅ Using app metadata name:', user.app_metadata.name);
      // Update the centralized state with the better name
      if (updateProfileDirectly) {
        const updatedProfile = {
          ...currentProfile,
          name: user.app_metadata.name.trim(),
          updated_at: new Date().toISOString()
        };
        updateProfileDirectly(updatedProfile);
        console.log('🔄 Updated centralized state with better name from app metadata');
      }
      return user.app_metadata.name.trim();
    }
    if (user?.email && user.email.trim()) {
      const emailName = user.email.split('@')[0];
      console.log('⚠️ Using email-based name as last resort:', emailName);
      return emailName;
    }
    console.log('⚠️ No name found, using fallback');
    return 'Tonald Drump';
  })();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    // Check if profile name is valid (not empty, not email-based)
    const isEmailBasedName = currentProfile?.name && 
                             (currentProfile.name.includes('@') || 
                              currentProfile.name === user?.email?.split('@')[0] ||
                              currentProfile.name.toLowerCase() === user?.email?.split('@')[0]?.toLowerCase());
    
    if (currentProfile?.name && currentProfile.name.trim() && !isEmailBasedName) {
      const names = currentProfile.name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.user_metadata?.full_name && user.user_metadata.full_name.trim()) {
      const names = user.user_metadata.full_name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.user_metadata?.name && user.user_metadata.name.trim()) {
      const names = user.user_metadata.name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.email && user.email.trim()) {
      const emailName = user.email.split('@')[0];
      return emailName[0].toUpperCase();
    }
    return 'TD';
  };

  // Get user role from profile data
  const getUserRole = () => {
    if (currentProfile?.role && currentProfile.role.trim()) {
      console.log('✅ Using profile role from centralized state:', currentProfile.role);
      return currentProfile.role.trim();
    }
    if (user?.user_metadata?.role && user.user_metadata.role.trim()) {
      console.log('✅ Using user metadata role:', user.user_metadata.role);
      return user.user_metadata.role.trim();
    }
    if (user?.app_metadata?.role && user.app_metadata.role.trim()) {
      console.log('✅ Using app metadata role:', user.app_metadata.role);
      return user.app_metadata.role.trim();
    }
    console.log('⚠️ No role found, using fallback');
    return 'Family Member';
  };

  // Mock data for demonstration
  const mockData = {
    flames: 10001,
    tasks: {
      active: 0,
      lastAdded: '01.01.2025'
    },
    calendar: {
      active: 1,
      lastAdded: '01.01.2025'
    },
    shopping: {
      items: 15,
      lastAdded: '01.01.2025'
    },
    todayEvents: [
      {
        id: 1,
        title: 'Townhall Meeting',
        time: '01:30 AM - 02:00 AM',
        attendees: 6,
        type: 'meeting'
      },
      {
        id: 2,
        title: 'Dashboard Report',
        time: '01:30 AM - 02:00 AM',
        attendees: 3,
        type: 'meeting'
      }
    ],
    todayTasks: [
      {
        id: 1,
        title: 'Wiring Dashboard Analytics',
        status: 'In Progress',
        priority: 'High',
        progress: 60,
        dueDate: '27 April',
        assignees: 3
      }
    ]
  };

  // Create themed styles
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface} 
      />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {currentProfile?.avatar_url ? (
                <Image 
                  source={{ uri: currentProfile.avatar_url }} 
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.verifiedIcon}>
                  <VerificationIcon size={20} />
                </View>
              </View>
              <Text style={styles.userRole}>{t('home.profile.family')} {getUserRole()}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Pressable 
              style={styles.notificationButton}
              onPress={() => {
                // Clear notification count when user opens notifications
                setNotificationCount(0);
                router.push('/notifications');
              }}
            >
              <Image 
                source={require('@/assets/images/icon/notification.png')}
                style={styles.notificationIcon}
                resizeMode="contain"
              />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Futures Elements Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.sections.futuresElements')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>{t('home.sections.quickActionsDescription')}</Text>
          
          <View style={styles.quickActionsGrid}>
            {/* Tasks */}
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <View style={styles.quickActionIcon}>
                <Image
                  source={require('@/assets/images/icon/tasks.png')}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain'
                  }}
                />
              </View>
              <Text style={styles.quickActionTitle}>{t('home.quickActions.tasks.title')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('home.quickActions.tasks.subtitle')}</Text>
            </Pressable>

            {/* Calendar */}
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/calendar')}
            >
              <View style={styles.quickActionIcon}>
                <Image
                  source={require('@/assets/images/icon/calendar2.png')}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain'
                  }}
                />
              </View>
              <Text style={styles.quickActionTitle}>{t('home.quickActions.calendar.title')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('home.quickActions.calendar.subtitle')}</Text>
            </Pressable>

            {/* Shop List */}
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/shopList')}
            >
              <View style={styles.quickActionIcon}>
                <Image
                  source={require('@/assets/images/icon/shop_list.png')}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain'
                  }}
                />
              </View>
              <Text style={styles.quickActionTitle}>{t('home.quickActions.shopList.title')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('home.quickActions.shopList.subtitle')}</Text>
            </Pressable>

            {/* Soon */}
            <Pressable style={[styles.quickActionButton, styles.quickActionButtonDisabled]}>
              <View style={[styles.quickActionIcon, styles.quickActionIconDisabled]}>
                <Image
                  source={require('@/assets/images/icon/soon_dis.png')}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain'
                  }}
                />
              </View>
              <Text style={[styles.quickActionTitle, styles.quickActionTitleDisabled]}>{t('home.quickActions.soon.title')}</Text>
              <Text style={[styles.quickActionSubtitle, styles.quickActionSubtitleDisabled]}>{t('home.quickActions.soon.subtitle')}</Text>
            </Pressable>
          </View>
        </View>

        {/* My Work Summary Banner */}
        <View style={styles.workSummaryBanner}>
          <View style={styles.workSummaryContent}>
            <View style={styles.workSummaryText}>
              <Text style={styles.workSummaryTitle}>{t('home.workSummary.title')}</Text>
              <Text style={styles.workSummarySubtitle}>{t('home.workSummary.subtitle')}</Text>
            </View>
            <View style={styles.workSummaryIcon}>
              <Image
                source={require('@/assets/images/icon/sparkling_camera.png')}
                style={{
                  width: 117,
                  height: 85,
                  resizeMode: 'contain'
                }}
              />

            </View>
          </View>
        </View>

        {/* Today on the Calendar Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.sections.todayCalendar')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{todayEvents.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>{t('home.sections.calendarDescription')}</Text>
          
          {eventsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>{t('home.loading.events')}</Text>
            </View>
          ) : eventsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('home.errors.loadEvents')}</Text>
            </View>
          ) : todayEvents.length > 0 ? (
            todayEvents.map((event) => {
              console.log('🎯 Rendering event:', event.title, {
                assignees: event.assignees,
                assignee_count: event.assignee_count
              });
              return (
                <View key={event.id} style={styles.calendarEventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventMainTitle}>{event.title}</Text>
                  </View>
                  
                   {event.description && (
                     <View style={styles.eventDescriptionContainer}>
                       <Text style={styles.eventDescription} numberOfLines={2}>
                         {event.description}
                       </Text>
                     </View>
                   )}
                   
                   <View style={styles.eventDetailsContainer}>
                     <View style={styles.eventDetailsGroup}>
                       <View style={styles.eventDetailItemLeft}>
                         <Text style={styles.eventDetailLabel}>{t('home.events.eventTitle')}</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>{event.title}</Text>
                       </View>
                       <View style={styles.eventDetailItemCenter}>
                         <Text style={styles.eventDetailLabel}>{t('home.events.startTime')}</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>
                           {new Date(event.event_date).toLocaleTimeString('en-US', { 
                             hour: '2-digit', 
                             minute: '2-digit',
                             hour12: true 
                           })}
                         </Text>
                       </View>
                       <View style={styles.eventDetailItemRight}>
                         <Text style={styles.eventDetailLabel}>{t('home.events.duration')}</Text>
                         <Text style={styles.eventDetailValue} numberOfLines={1}>
                           {event.end_date ? 
                             `${Math.round((new Date(event.end_date).getTime() - new Date(event.event_date).getTime()) / (1000 * 60 * 60))}h` : 
                             t('home.events.allDay')
                           }
                         </Text>
                       </View>
                     </View>
                   </View>
                   
                   {/* Avatars positioned at bottom left - using assignees data */}
                   <View style={styles.eventAvatarsContainer}>
                     {(() => {
                       console.log('🔍 Avatar check for event:', event.title, {
                         has_assignees: !!event.assignees,
                         assignees_length: event.assignees?.length || 0,
                         assignees: event.assignees
                       });
                       return null;
                     })()}
                     {event.assignees && event.assignees.length > 0 ? (
                       <View style={styles.assigneeAvatars}>
                          {event.assignees.slice(0, 3).map((assignee, index) => {
                            console.log('🎨 Rendering avatar for assignee:', {
                              name: assignee.name,
                              avatar: assignee.avatar,
                              user_id: assignee.user_id,
                              full_assignee: assignee
                            });
                            const avatarColors = ['#FFB6C1', '#FFD700', '#87CEEB'];
                            return (
                              <View key={assignee.user_id} style={[styles.assigneeAvatar, { backgroundColor: avatarColors[index] }]}>
                          {assignee.avatar ? (
                            <Image
                              source={{ uri: assignee.avatar }}
                              style={styles.assigneeAvatarImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.assigneeAvatarPlaceholder}>
                              <Text style={styles.assigneeAvatarInitial}>
                                {assignee.name ? assignee.name.charAt(0).toUpperCase() : '?'}
                              </Text>
                            </View>
                          )}
                              </View>
                            );
                          })}
                         {event.assignees.length > 3 && (
                           <View style={[styles.assigneeAvatar, { backgroundColor: '#9CA3AF' }]}>
                             <View style={styles.assigneeAvatarPlaceholder}>
                               <Text style={styles.assigneeAvatarInitial}>+{event.assignees.length - 3}</Text>
                             </View>
                           </View>
                         )}
                       </View>
                     ) : (
                       <View style={styles.assigneeAvatars}>
                         {/* Show current user as assignee when no assignees */}
                         <View style={[styles.assigneeAvatar, { backgroundColor: '#FF6B6B' }]}>
                           {profile?.avatar_url ? (
                             <Image
                               source={{ uri: profile.avatar_url }}
                               style={styles.assigneeAvatarImage}
                               resizeMode="cover"
                             />
                           ) : (
                             <View style={styles.assigneeAvatarPlaceholder}>
                               <Text style={styles.assigneeAvatarInitial}>
                                 {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                               </Text>
                             </View>
                           )}
                         </View>
                       </View>
                     )}
                   </View>
                  
                  <View style={styles.eventDateContainer}>
                    <Image
                      source={require('@/assets/images/icon/calendar2_dis.png')}
                      style={{
                        width: 16,
                        height: 16,
                        resizeMode: 'contain'
                      }}
                    />
                    <Text style={styles.eventDate}>
                    {new Date().toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTaskCard}>
              <Image
                source={require('@/assets/images/icon/meeting_image.png')}
                style={styles.emptyTaskIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTaskText}>{t('home.emptyStates.noMeetings')}</Text>
              <Text style={styles.emptyTaskSubtext}>
                {t('home.emptyStates.noMeetingsDescription')}
              </Text>
            </View>
          )}
        </View>

        {/* Today Task Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.sections.todayTasks')}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{todayTasks.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>{t('home.sections.tasksDescription')}</Text>
              
              {tasksLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={styles.loadingText}>{t('home.loading.tasks')}</Text>
                </View>
              ) : tasksError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{t('home.errors.loadTasks')}</Text>
                </View>
              ) : todayTasks.length > 0 ? (
                todayTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
             <View style={styles.taskHeader}>
               <View style={styles.taskIcon}>
                 <Image
                   source={require('@/assets/images/icon/flash.png')}
                   style={{
                     width: 20,
                     height: 20,
                     resizeMode: 'contain'
                   }}
                 />
               </View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
             </View>
            
             <View style={styles.taskTags}>
               <View style={styles.statusTag}>
                 <Image
                   source={require('@/assets/images/icon/in_progress.png')}
                   style={{
                     width: 10,
                     height: 10,
                     resizeMode: 'contain'
                   }}
                 />
                    <Text style={styles.statusTagText}>{task.completed ? t('home.tasks.completed') : t('home.tasks.inProgress')}</Text>
               </View>
               <View style={styles.priorityTag}>
                 <Image
                   source={require('@/assets/images/icon/flag.png')}
                   style={{
                     width: 10,
                     height: 10,
                     resizeMode: 'contain'
                   }}
                 />
                    <Text style={styles.priorityTagText}>{t('home.tasks.highPriority')}</Text>
               </View>
             </View>
            
            <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${task.completed ? 100 : 0}%` }
                  ]} />
            </View>
            
            <View style={styles.taskFooter}>
              <View style={styles.assigneeAvatars}>
                <View style={[styles.assigneeAvatar, { backgroundColor: '#FF6B6B' }]}>
                  <View style={styles.assigneeAvatarPlaceholder}>
                    <Text style={styles.assigneeAvatarInitial}>?</Text>
                  </View>
                </View>
              </View>
               <View style={styles.dueDateContainer}>
                 <Image
                   source={require('@/assets/images/icon/calendar2_dis.png')}
                   style={{
                     width: 16,
                     height: 16,
                     resizeMode: 'contain'
                   }}
                 />
                    <Text style={styles.dueDate}>
                      {task.end_date && (
                        <Text style={styles.endTimeText}>
                          {new Date(task.end_date).toLocaleDateString("en-US", { month: 'long', day: 'numeric' })}
                        </Text>
                      )}
                    </Text>
               </View>
            </View>
          </View>
            ))
          ) : (
            <View style={styles.emptyTaskCard}>
              <Image
                source={require('@/assets/images/icon/no_task.svg')}
                style={styles.emptyTaskIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTaskText}>{t('home.emptyStates.noTasks')}</Text>
              <Text style={styles.emptyTaskSubtext}>
                {t('home.emptyStates.noTasksDescription')}
              </Text>
            </View>
          )}
        </View>

        {/* Today added to Shopping list Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.sections.todayShopping')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{todayShoppingItems.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>{t('home.sections.shoppingDescription')}</Text>
          
          {shoppingLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>{t('home.loading.shoppingItems')}</Text>
            </View>
          ) : shoppingError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('home.errors.loadShoppingItems')}</Text>
            </View>
          ) : todayShoppingItems.length > 0 ? (
            todayShoppingItems.map((item) => (
              <View key={item.id} style={styles.shoppingListItemCard}>
                <View style={styles.shoppingItemHeader}>
                  <Image
                    source={require('@/assets/images/icon/shop_date.png')}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: 'contain'
                    }}
                  />
                  <Text style={styles.shoppingItemDate}>
                    {new Date(item.created_at).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.shoppingItemDetailsGroup}>
                  <View style={styles.shoppingItemLeft}>
                    <Text style={styles.shoppingItemLabel}>{t('home.shopping.item')}</Text>
                    <Text style={styles.shoppingItemName}>{item.name}</Text>
                  </View>
                  <View style={styles.shoppingItemRight}>
                    <Text style={styles.shoppingItemLabel}>{t('home.shopping.quantity')}</Text>
                    <Text style={styles.shoppingItemQuantity}>{item.quantity || '1 stk.'}</Text>
                  </View>
                </View>
                
                <View style={styles.shoppingItemFooter}>
                  <View style={styles.purchaseStatus}>
                    {item.completed ? (
                      <>
                        <Image
                          source={require('@/assets/images/icon/check.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain'
                          }}
                        />
                        <Text style={styles.purchaseStatusText}>
                          {t('home.shopping.purchasedAt')} {new Date(item.updated_at).toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Image
                          source={require('@/assets/images/icon/in_progress.png')}
                          style={{
                            width: 16,
                            height: 16,
                            resizeMode: 'contain'
                          }}
                        />
                        <Text style={[styles.purchaseStatusText, { color: '#666666' }]}>
                          {t('home.shopping.pendingPurchase')}
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={styles.purchaserInfo}>
                    <View style={styles.purchaserAvatar}>
                      {item.creator_profile?.avatar_url ? (
                        <Image
                          source={{ uri: item.creator_profile.avatar_url }}
                          style={styles.purchaserAvatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.purchaserAvatarText}>
                          {item.creator_profile?.name ? item.creator_profile.name.charAt(0).toUpperCase() : '?'}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.purchaserName}>
                      {item.creator_profile?.name || t('home.shopping.unknown')}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyTaskCard}>
              <Image
                source={require('@/assets/images/icon/no_shopping_item.png')}
                style={styles.emptyTaskIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTaskText}>{t('home.emptyStates.noShoppingItems')}</Text>
              <Text style={styles.emptyTaskSubtext}>
                {t('home.emptyStates.noShoppingItemsDescription')}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 108, // Add padding to account for fixed header (44 + 20 + 20 + 24 for safe area)
  },
  
  // Fixed Header Section
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.surface,
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text === '#ffffff' ? '#FFFFFF' : '#000000',
  },
  profileDetails: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  verifiedIcon: {
    // Verified checkmark styling
  },
  userRole: {
    fontSize: 12,
    color: '#17f196',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flamesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9fff6',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minWidth: 100,
    gap: 20,
  },
  flameIcon: {
    left: 6,
    width: 15,
    height: 18,
  },
  flamesText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9fff6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: 20,
    height: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 2,
    // borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Section Styling
  section: {
    paddingHorizontal: 20,
    // paddingVertical: 20,
  },
  futuresElementsPanel: {
    backgroundColor: theme.surface,
    marginHorizontal: 10,
    marginVertical: 12,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 8,
    // marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  badge: {
    backgroundColor: '#e9fff6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#17f196',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textTertiary,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 6,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderColor: theme.border,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 2,
  },
  quickActionButtonDisabled: {
    opacity: 0.6,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconDisabled: {
    backgroundColor: '#E0E0E0',
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
    // marginBottom: 4,
    textAlign: 'center',
  },
  quickActionTitleDisabled: {
    color: theme.placeholder,
  },
  quickActionSubtitle: {
    fontSize: 8,
    fontWeight: '400',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  quickActionSubtitleDisabled: {
    color: theme.placeholder,
  },

  // Work Summary Banner
  workSummaryBanner: {
    backgroundColor: '#17F196',
    marginHorizontal: 10,
    marginVertical: 0,
    borderRadius: 12,
    padding: 20,
  },
  workSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workSummaryText: {
    flex: 1,
  },
  workSummaryTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  workSummarySubtitle: {
    color: '#EDEAFF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: -0.5,
  },
  workSummaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sparkle1: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  sparkle2: {
    position: 'absolute',
    bottom: 12,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sparkle3: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  emptyShoppingArea: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    height: 120,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Events List
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  eventAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeAvatars: {
    flexDirection: 'row',
    gap: -8,
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  attendeeAvatar1: {
    backgroundColor: '#FFB6C1',
  },
  attendeeAvatar2: {
    backgroundColor: '#FFD700',
  },
  attendeeAvatar3: {
    backgroundColor: '#87CEEB',
  },
  attendeeCount: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  eventActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  eventTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  joinButton: {
    backgroundColor: '#17f196',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Task Card
  taskCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  taskIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#17F196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  taskDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  taskTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusTagIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.textSecondary,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  priorityTagIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.input,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17f196',
    borderRadius: 2,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeAvatars: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.surface,
    marginLeft: -8,
  },
  assigneeAvatar1: {
    backgroundColor: '#FFB6C1',
    marginLeft: 0, // First avatar has no left margin
  },
  assigneeAvatar2: {
    backgroundColor: '#FFD700',
  },
  assigneeAvatar3: {
    backgroundColor: '#87CEEB',
  },
  assigneeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  assigneeAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  endTimeText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },

  // Empty Task Card
  emptyTaskCard: {
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTaskIcon: {
    width: 140,
    height: 88,
    marginBottom: 20,
  },
  emptyTaskText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161B23',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyTaskSubtext: {
    fontSize: 10,
    color: '#777F8C',
    fontWeight: '400',
    textAlign: 'center',
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },


  // Tasks Loading
  tasksLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  tasksLoadingText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  // Calendar Event Card
  calendarEventCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 12,
    marginTop: 8,
    position: 'relative',
  },
  eventHeader: {
    marginBottom: 16,
  },
  eventMainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 4,
  },
  eventPrivateMessage: {
    fontSize: 12,
    fontWeight: '400',
    color: '#101828',
    lineHeight: 18,
  },
   eventDetailsContainer: {
     marginBottom: 32,
   },
   eventDetailsGroup: {
     flexDirection: 'row',
     borderWidth: 1,
     borderColor: '#EAECF0',
     borderRadius: 8,
     padding: 12,
     paddingHorizontal: 15,
     backgroundColor: '#F9FAFB',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   eventDetailItem: {
    //  flex: -1,
    padding:5,
   },
   eventDetailItemLeft: {
     flex: 2,
     padding: 5,
     alignItems: 'flex-start',
   },
   eventDetailItemCenter: {
     flex: 1,
     padding: 5,
     alignItems: 'center',
   },
   eventDetailItemRight: {
     flex: 1,
     padding: 5,
     alignItems: 'flex-end',
   },
   eventDetailLabel: {
     fontSize: 12,
     fontWeight: '500',
     color: theme.textTertiary,
     marginBottom: 2,
   },
    eventDetailValue: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    eventDescriptionContainer: {
      marginBottom: 12,
    },
    eventDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    eventDateContainer: {
    position :'absolute',
    right : 20,
    bottom : 0,
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
     alignSelf: 'flex-end',
     marginBottom: 16,
   },
   eventDate: {
     fontSize: 12,
     color: theme.textSecondary,
   },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  // Shopping List Item Card
  shoppingListItemCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 2,
  },
  shoppingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  shoppingItemDate: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  shoppingItemDetailsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: theme.input,
  },
  shoppingItemLeft: {
    flex: 1,
  },
  shoppingItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  shoppingItemLabel: {
    fontSize: 12,
    color: theme.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
  },
  shoppingItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  shoppingItemQuantity: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  shoppingItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purchaseStatusText: {
    fontSize: 12,
    color: '#19B36E',
    fontWeight: '500',
  },
  purchaserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purchaserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB6C1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaserAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  purchaserAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  purchaserName: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
  },
  attendeeCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textSecondary,
  },
  attendeeAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  attendeeInitials: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  eventAvatarsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorStateContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorStateText: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#17f196',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});