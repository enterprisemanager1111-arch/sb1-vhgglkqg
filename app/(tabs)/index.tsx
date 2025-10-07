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
} from 'react-native';
// Removed unused lucide-react-native imports
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

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
  const [refreshedProfile, setRefreshedProfile] = useState(profile);
  
  // Refresh profile data when component mounts to ensure we have the latest data
  useEffect(() => {
    const refreshProfileData = async () => {
      if (!user || !session?.access_token) {
        console.log('⚠️ Home page: No user or session for profile refresh');
        return;
      }
      
      try {
        console.log('🔄 Home page: Refreshing profile data via REST API...');
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const profileData = await response.json();
          console.log('✅ Home page: Profile data refreshed via REST API:', profileData);
          if (profileData && profileData.length > 0) {
            setRefreshedProfile(profileData[0]);
          }
        } else {
          console.log('⚠️ Home page: Profile refresh failed:', response.status);
        }
      } catch (error) {
        console.log('⚠️ Home page: Profile refresh failed:', error);
      }
    };
    
    refreshProfileData();
  }, []); // Run once on mount

  // Use refreshed profile data if available, fallback to original profile
  const currentProfile = refreshedProfile || profile;

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
            <Pressable style={styles.notificationButton}>
              <Image 
                source={require('@/assets/images/icon/notification.png')}
                style={styles.notificationIcon}
                resizeMode="contain"
              />
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
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>The tasks assigned to you for today</Text>
          
          <View style={styles.taskCard}>
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
               <Text style={styles.taskTitle}>Wiring Dashboard Analytics</Text>
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
                 <Text style={styles.statusTagText}>In Progress</Text>
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
                 <Text style={styles.priorityTagText}>High</Text>
               </View>
             </View>
            
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            
            <View style={styles.taskFooter}>
              <View style={styles.assigneeAvatars}>
                <View style={[styles.assigneeAvatar, styles.assigneeAvatar1]} />
                <View style={[styles.assigneeAvatar, styles.assigneeAvatar2]} />
                <View style={[styles.assigneeAvatar, styles.assigneeAvatar3]} />
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
                 <Text style={styles.dueDate}>27 April</Text>
               </View>
            </View>
          </View>
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
  },
  notificationIcon: {
    width: 20,
    height: 20,
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
    gap: -8,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  assigneeAvatar1: {
    backgroundColor: '#FFB6C1',
  },
  assigneeAvatar2: {
    backgroundColor: '#FFD700',
  },
  assigneeAvatar3: {
    backgroundColor: '#87CEEB',
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

  // Bottom spacing
  bottomSpacing: {
    height: 100,
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