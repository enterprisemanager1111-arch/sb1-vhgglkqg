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
import { 
  Bell, 
  ChevronRight, 
  Calendar, 
  SquareCheck as CheckSquare, 
  Users, 
  ShoppingCart, 
  ArrowRight, 
  Flame,
  Clock,
  ListTodo,
  TrendingUp,
  Video,
  Zap,
  CheckCircle,
  Plus
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

// Custom verification icon component
const VerificationIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Starburst/Cog shape - made much bigger for better visibility */}
    <Path
      d="M12 0L15 5L22 3L17 8L22 13L15 11L12 16L9 11L2 13L7 8L2 3L9 5L12 0Z"
      fill="#55fdb7"
    />
    {/* White checkmark - properly contained within the much larger starburst */}
    <Path
      d="M8.5 12L10.5 14L15.5 9"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export default function HomeDashboard() {
  const { user, profile } = useAuth();

  // Extract full name for greeting
  const userName = (() => {
    if (profile?.name) {
      return profile.name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return 'Tonald Drump';
  })();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.name) {
      const names = profile.name.split(' ');
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
    if (profile?.role) {
      return profile.role;
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
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image 
                    source={{ uri: profile.avatar_url }} 
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
                    <VerificationIcon size={16} />
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
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <ListTodo size={24} color="#17f196" fill="#17f196" />
              </View>
              <Text style={styles.quickActionTitle}>Tasks</Text>
              <Text style={styles.quickActionSubtitle}>Start now!</Text>
            </Pressable>

            {/* Calendar */}
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <Calendar size={24} color="#17f196" fill="#17f196" />
              </View>
              <Text style={styles.quickActionTitle}>Calander</Text>
              <Text style={styles.quickActionSubtitle}>Your Event</Text>
            </Pressable>

            {/* Shop List */}
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <ShoppingCart size={24} color="#17f196" fill="#17f196" />
              </View>
              <Text style={styles.quickActionTitle}>Shop List</Text>
              <Text style={styles.quickActionSubtitle}>Buy Items</Text>
            </Pressable>

            {/* Soon */}
            <Pressable style={[styles.quickActionButton, styles.quickActionButtonDisabled]}>
              <View style={[styles.quickActionIcon, styles.quickActionIconDisabled]}>
                <Clock size={24} color="#999999" fill="#999999" />
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
              <Video size={24} color="#FFFFFF" fill="#FFFFFF" />
              <View style={styles.sparkle1} />
              <View style={styles.sparkle2} />
              <View style={styles.sparkle3} />
            </View>
          </View>
        </View>

        {/* Today on the Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today on the Calander</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Your schedule for the day</Text>
          
          <View style={styles.emptyCalendarArea}>
            {/* Empty white area as shown in the image */}
          </View>
        </View>

        {/* Today Task Section */}
        <View style={styles.section}>
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
                <Zap size={20} color="#17f196" fill="#17f196" />
              </View>
              <Text style={styles.taskTitle}>Wiring Dashboard Analytics</Text>
            </View>
            
            <View style={styles.taskTags}>
              <View style={styles.statusTag}>
                <View style={styles.statusTagIcon} />
                <Text style={styles.statusTagText}>In Progress</Text>
              </View>
              <View style={styles.priorityTag}>
                <View style={styles.priorityTagIcon} />
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
                <Calendar size={16} color="#17f196" fill="#17f196" />
                <Text style={styles.dueDate}>27 April</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today added to Shopping list Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today added to Shopping list</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Your schedule for the day</Text>
          
          <View style={styles.emptyShoppingArea}>
            {/* Empty white area as shown in the image */}
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
  
  // Header Section
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    paddingVertical: 20,
  },
  futuresElementsPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    color: '#666666',
    marginBottom: 16,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#F0F0F0',
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
    backgroundColor: '#17f196',
    marginHorizontal: 20,
    marginVertical: 20,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workSummarySubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  workSummaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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

  // Empty Areas
  emptyCalendarArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 120,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
});