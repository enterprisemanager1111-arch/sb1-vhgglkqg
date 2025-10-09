import React, { useEffect, useState } from 'react';
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
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamily } from '@/contexts/FamilyContext';
import { useLoading } from '@/contexts/LoadingContext';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';

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
  const { user, profile, session } = useAuth();
  const { tasks, loading: tasksLoading, refreshTasks } = useFamilyTasks();
  const { currentFamily, loading: familyLoading } = useFamily();
  const { showLoading, hideLoading } = useLoading();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingStarted, setLoadingStarted] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Show loading interface while initial data is being loaded
  useEffect(() => {
    if (isInitialLoading && !loadingStarted) {
      setLoadingStarted(true);
      showLoading('Loading your dashboard...');
    }
  }, [isInitialLoading, showLoading, loadingStarted]);

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
      const hasFamily = !!currentFamily;
      const isTasksLoaded = !tasksLoading;
      const isFamilyLoaded = !familyLoading;

      // Only hide loading when ALL data is completely loaded
      if (hasUser && hasProfile && hasFamily && isTasksLoaded && isFamilyLoaded) {
        // Add a small delay to ensure loading interface is visible
        setTimeout(() => {
          setIsInitialLoading(false);
          hideLoading();
        }, 500); // 500ms minimum loading time
      }
    };

    checkInitialLoading();
  }, [user, profile, currentFamily, tasksLoading, familyLoading, hideLoading]);

  // Removed unnecessary profile refresh API call

  // Only refresh tasks when coming back from task creation, not on every focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're not in initial loading state
      // This prevents unnecessary API calls during initial load
      if (!isInitialLoading && currentFamily) {
        refreshTasks();
      }
      
      // Refresh notification count when returning to home page
      if (user?.id) {
        const refreshNotificationCount = async () => {
          try {
            const { count, error } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('assignee_id', user.id)
              .eq('status', 'unread');
            
            if (!error) {
              setNotificationCount(count || 0);
            }
          } catch (error) {
            console.error('❌ Error refreshing notification count:', error);
          }
        };
        
        refreshNotificationCount();
      }
    }, [refreshTasks, isInitialLoading, currentFamily, user?.id])
  );

  // Remove unnecessary family refresh - FamilyContext already loads data
  // The family data is already loaded by FamilyContext, no need to refresh again

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `assignee_id=eq.${user.id}`
        },
        (payload) => {
          setNotificationCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `assignee_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh notification count when status changes
          fetchNotificationCount();
        }
      )
      .subscribe();

    // Load initial notification count
    const fetchNotificationCount = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        const fetchPromise = supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', user.id)
          .eq('status', 'unread');

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const { count, error } = result;
        
        if (error) {
          setNotificationCount(0);
        } else {
          setNotificationCount(count || 0);
        }
      } catch (error) {
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Use profile from AuthContext
  const currentProfile = profile;

  // Calculate task progress based on current date between start_date and end_date
  const calculateTaskProgress = (task: any) => {
    if (!task.start_date || !task.end_date) {
      return 0;
    }

    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);
    const currentDate = new Date();

    // If task is completed, show 100%
    if (task.completed) {
      return 100;
    }

    // If current date is before start date, show 0%
    if (currentDate < startDate) {
      return 0;
    }

    // If current date is after end date, show 100%
    if (currentDate > endDate) {
      return 100;
    }

    // Calculate progress: (current - start) / (end - start) * 100
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    const progress = (elapsedDuration / totalDuration) * 100;

    return Math.round(progress);
  };

  // Filter tasks for today (current date between start_date and end_date)
  const getTodayTasks = () => {
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const filteredTasks = tasks.filter(task => {
      // Check if task has start_date and end_date
      if (!task.start_date || !task.end_date) {
        return false;
      }
      
      // Convert dates to YYYY-MM-DD format for comparison
      const startDate = new Date(task.start_date).toISOString().split('T')[0];
      const endDate = new Date(task.end_date).toISOString().split('T')[0];
      
      // Check if today is between start_date and end_date (inclusive)
      const isToday = todayString >= startDate && todayString <= endDate;
      
      return isToday;
    });
    
    return filteredTasks;
  };

  const todayTasks = getTodayTasks();

  // Extract full name for greeting
  const userName = (() => {
    if (currentProfile?.name) {
      return currentProfile.name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return 'Tonald Drump';
  })();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentProfile?.name) {
      const names = currentProfile.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return 'TD';
  };

  // Get user role
  const getUserRole = () => {
    if (currentProfile?.role) {
      return currentProfile.role;
    }
    if (user?.user_metadata?.role) {
      return user.user_metadata.role;
    }
    if (user?.app_metadata?.role) {
      return user.app_metadata.role;
    }
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


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
              <Text style={styles.userRole}>Family {getUserRole()}</Text>
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
            <Text style={styles.sectionTitle}>Futures Elements</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Quickaction to all our Funktions</Text>
          
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
              <Text style={styles.quickActionTitle}>Tasks</Text>
              <Text style={styles.quickActionSubtitle}>Start now!</Text>
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
              <Text style={styles.quickActionTitle}>Calander</Text>
              <Text style={styles.quickActionSubtitle}>Your Event</Text>
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
              <Text style={styles.quickActionTitle}>Shop List</Text>
              <Text style={styles.quickActionSubtitle}>Buy Items</Text>
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
              <Text style={[styles.quickActionTitle, styles.quickActionTitleDisabled]}>Soon</Text>
              <Text style={[styles.quickActionSubtitle, styles.quickActionSubtitleDisabled]}>Hyped?</Text>
            </Pressable>
          </View>
        </View>

        {/* My Work Summary Banner */}
        <View style={styles.workSummaryBanner}>
          <View style={styles.workSummaryContent}>
            <View style={styles.workSummaryText}>
              <Text style={styles.workSummaryTitle}>My Work Summary</Text>
              <Text style={styles.workSummarySubtitle}>Today task & presence activity</Text>
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
            <Text style={styles.sectionTitle}>Today on the Calander</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Your schedule for the day</Text>
          
          <View style={styles.calendarEventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventMainTitle}>Bob's Birthday</Text>
              <Text style={styles.eventPrivateMessage}>Private message: Don't forget the gifts</Text>
            </View>
            
             <View style={styles.eventDetailsContainer}>
               <View style={styles.eventDetailsGroup}>
                 <View style={styles.eventDetailItemLeft}>
                   <Text style={styles.eventDetailLabel}>Event Title</Text>
                   <Text style={styles.eventDetailValue} numberOfLines={1}>Birthday Party</Text>
                 </View>
                 <View style={styles.eventDetailItemCenter}>
                   <Text style={styles.eventDetailLabel}>Start Time</Text>
                   <Text style={styles.eventDetailValue} numberOfLines={1}>20:00 Uhr</Text>
                 </View>
                 <View style={styles.eventDetailItemRight}>
                   <Text style={styles.eventDetailLabel}>Duration</Text>
                   <Text style={styles.eventDetailValue} numberOfLines={1}>30min</Text>
                 </View>
               </View>
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
                 <Text style={styles.eventDate}>20, September</Text>
               </View>
            
            <View style={styles.eventFooter}>
              <View style={styles.eventAttendees}>
                <View style={[styles.attendeeAvatar, { backgroundColor: '#FFB6C1' }]} />
                <View style={[styles.attendeeAvatar, { backgroundColor: '#87CEEB' }]} />
                <View style={[styles.attendeeAvatar, { backgroundColor: '#FFD700' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Today Task Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today Task</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{todayTasks.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>The tasks assigned to you for today</Text>
          
          {tasksLoading ? (
            <View style={styles.tasksLoadingContainer}>
              <ActivityIndicator size="small" color="#17f196" />
              <Text style={styles.tasksLoadingText}>Loading tasks...</Text>
            </View>
          ) : todayTasks.length > 0 ? (
            todayTasks.map((task) => {
              console.log(`🔍 Rendering task: ${task.title}`);
              console.log(`🔍 Task assignments:`, task.task_assignments);
              return (
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
               
                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}
            
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
                    <Text style={styles.statusTagText}>
                      {task.completed ? 'Completed' : 'In Progress'}
                    </Text>
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
                    <Text style={styles.priorityTagText}>
                      {task.points >= 200 ? 'High' : task.points >= 100 ? 'Medium' : 'Low'}
                    </Text>
               </View>
             </View>
            
            <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: task.completed ? '100%' : `${Math.min(100, Math.max(0, calculateTaskProgress(task)))}%` }
                  ]} />
            </View>
            
            <View style={styles.taskFooter}>
              <View style={styles.assigneeAvatars}>
                    {task.task_assignments && task.task_assignments.length > 0 ? (
                      task.task_assignments.slice(0, 3).map((assignment, index) => (
                        <View 
                          key={assignment.id} 
                          style={[
                            styles.assigneeAvatar, 
                            index === 0 && styles.assigneeAvatar1,
                            index === 1 && styles.assigneeAvatar2,
                            index === 2 && styles.assigneeAvatar3
                          ]} 
                        >
                          {assignment.assignee_profile?.avatar_url ? (
                            <Image
                              source={{ uri: assignment.assignee_profile.avatar_url }}
                              style={styles.assigneeAvatarImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.assigneeAvatarPlaceholder}>
                              <Text style={styles.assigneeAvatarInitial}>
                                {assignment.assignee_profile?.name?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={[styles.assigneeAvatar, styles.assigneeAvatar1]}>
                        <View style={styles.assigneeAvatarPlaceholder}>
                          <Text style={styles.assigneeAvatarInitial}>?</Text>
                        </View>
                      </View>
                    )}
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
                      {task.end_date ? new Date(task.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 'No due date'}
                    </Text>
               </View>
            </View>
          </View>
            );
            })
          ) : (
            <View style={styles.emptyTaskCard}>
              <Image
                source={require('@/assets/images/icon/no_task.svg')}
                style={styles.emptyTaskIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTaskText}>No Tasks Assigned</Text>
              <Text style={styles.emptyTaskSubtext}>
                It looks like you don't have any tasks assigned to you right now. Don't worry, this space will be updated as new tasks become available.
              </Text>
            </View>
          )}
        </View>

        {/* Today added to Shopping list Section */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today added to Shopping list</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Your schedule for the day</Text>
          
          <View style={styles.shoppingListItemCard}>
            <View style={styles.shoppingItemHeader}>
              <Image
                source={require('@/assets/images/icon/shop_date.png')}
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain'
                }}
              />
              <Text style={styles.shoppingItemDate}>18 September 2024</Text>
            </View>
            
            <View style={styles.shoppingItemDetailsGroup}>
              <View style={styles.shoppingItemLeft}>
                <Text style={styles.shoppingItemLabel}>Item</Text>
                <Text style={styles.shoppingItemName}>Pizza Tonno</Text>
              </View>
              <View style={styles.shoppingItemRight}>
                <Text style={styles.shoppingItemLabel}>Quantity</Text>
                <Text style={styles.shoppingItemQuantity}>2 stk.</Text>
              </View>
            </View>
            
            <View style={styles.shoppingItemFooter}>
              <View style={styles.purchaseStatus}>
                <Image
                  source={require('@/assets/images/icon/check.png')}
                  style={{
                    width: 16,
                    height: 16,
                    resizeMode: 'contain'
                  }}
                />
                <Text style={styles.purchaseStatusText}>Purchased at 19 Sept 2024</Text>
              </View>
              <View style={styles.purchaserInfo}>
                <View style={styles.purchaserAvatar}>
                  <Text style={styles.purchaserAvatarText}>E</Text>
                </View>
                <Text style={styles.purchaserName}>Elaine</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f8',
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
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#2d2d2d',
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
    color: '#000000',
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
    color: '#2d2d2d',
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
    color: '#2d2d2d',
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
    borderWidth: 2,
    borderColor: '#ffffff',
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
    backgroundColor: '#FFFFFF',
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
    fontStyle: 'semibold',
    fontWeight: '600',
    color: '#040404',
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
    fontStyle: 'regular',
    fontWeight: '400',
    color: '#17f196',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#466759',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '140%',
    marginBottom: 6,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderColor: '#eaecf0',
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
    fontStyle: 'semibold',
    color: '#2d2d2d',
    // marginBottom: 4,
    textAlign: 'center',
  },
  quickActionTitleDisabled: {
    color: '#999999',
  },
  quickActionSubtitle: {
    fontSize: 8,
    fontStyle: 'regular',
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  quickActionSubtitleDisabled: {
    color: '#999999',
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
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 'normal',
    letterSpacing: '-0.5px',
  },
  workSummarySubtitle: {
    color: '#EDEAFF',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
    letterSpacing: '-0.5px',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 120,
    shadowColor: '#000000',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
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
    color: '#000000',
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
    borderColor: '#FFFFFF',
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
    color: '#666666',
  },
  eventActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  eventTime: {
    fontSize: 12,
    color: '#666666',
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
    border: '1px solid #EAECF0',
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
    color: '#2B2B2B',
    flex: 1,
  },
  taskDescription: {
    fontSize: 12,
    color: '#666666',
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
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusTagIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
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
    backgroundColor: '#E0E0E0',
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
    borderColor: '#FFFFFF',
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666666',
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
    border: '1px solid #EAECF0',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
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
     marginBottom: 16,
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
     color: '#475467',
     marginBottom: 2,
   },
   eventDetailValue: {
     fontSize: 16,
     fontWeight: '500',
     color: '#344054',
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
     color: '#666666',
   },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  eventAttendees: {
    flexDirection: 'row',
    gap: -8,
  },

  // Shopping List Item Card
  shoppingListItemCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    border: '1px solid #EAECF0',
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
    color: '#101828',
    fontWeight: '600',
  },
  shoppingItemDetailsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
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
    color: '#667085',
    fontWeight: '500',
    marginBottom: 4,
  },
  shoppingItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#344054',
  },
  shoppingItemQuantity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#344054',
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
  purchaserName: {
    fontSize: 12,
    color: '#2d2d2d',
    fontWeight: '500',
  },
});