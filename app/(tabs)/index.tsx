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
                <Text style={styles.userRole}>Family Teenager</Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <View style={styles.flamesContainer}>
                <Flame size={16} color="#17f196" fill="#17f196" />
                <Text style={styles.flamesText}>{mockData.flames}</Text>
              </View>
              <Pressable style={styles.notificationButton}>
                <Bell size={20} color="#17f196" fill="#17f196" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Futures Elements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Futures Elements</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Quickaction to all our Funktions</Text>
          
          <View style={styles.quickActionsGrid}>
            {/* Go to Tasks */}
            <View style={styles.quickActionCard}>
              <View style={styles.quickActionHeader}>
                <View style={styles.quickActionIcon}>
                  <ListTodo size={24} color="#17f196" fill="#17f196" />
                </View>
                <Text style={styles.quickActionTitle}>Go to Tasks</Text>
              </View>
              <View style={styles.quickActionContent}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>No Aktive Tasks</Text>
                </View>
                <View style={styles.quickActionDetails}>
                  <Text style={styles.lastAddedText}>Last Task added: {mockData.tasks.lastAdded}</Text>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Open Tasks</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Go to Calendar */}
            <View style={styles.quickActionCard}>
              <View style={styles.quickActionHeader}>
                <View style={styles.quickActionIcon}>
                  <Calendar size={24} color="#17f196" fill="#17f196" />
                </View>
                <Text style={styles.quickActionTitle}>Go to Calander</Text>
              </View>
              <View style={styles.quickActionContent}>
                <View style={[styles.statusPill, styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, styles.statusPillTextActive]}>One Aktive Metting</Text>
                </View>
                <View style={styles.quickActionDetails}>
                  <Text style={styles.lastAddedText}>Last Meeting added: {mockData.calendar.lastAdded}</Text>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Open Calander</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Go to Shopping list */}
            <View style={styles.quickActionCard}>
              <View style={styles.quickActionHeader}>
                <View style={styles.quickActionIcon}>
                  <ShoppingCart size={24} color="#17f196" fill="#17f196" />
                </View>
                <Text style={styles.quickActionTitle}>Go to Shopping list</Text>
              </View>
              <View style={styles.quickActionContent}>
                <View style={[styles.statusPill, styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, styles.statusPillTextActive]}>{mockData.shopping.items} Items on the List</Text>
                </View>
                <View style={styles.quickActionDetails}>
                  <Text style={styles.lastAddedText}>Last Item added: {mockData.shopping.lastAdded}</Text>
                  <Pressable style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Open Shopping list</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Coming Soon */}
            <View style={[styles.quickActionCard, styles.quickActionCardDisabled]}>
              <View style={styles.quickActionHeader}>
                <View style={[styles.quickActionIcon, styles.quickActionIconDisabled]}>
                  <Clock size={24} color="#999999" fill="#999999" />
                </View>
                <Text style={[styles.quickActionTitle, styles.quickActionTitleDisabled]}>Comming Soon</Text>
              </View>
              <View style={styles.quickActionContent}>
                <View style={[styles.statusPill, styles.statusPillDisabled]}>
                  <Text style={[styles.statusPillText, styles.statusPillTextDisabled]}>Stay Aktive for Updates</Text>
                </View>
              </View>
            </View>
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
              <Video size={32} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Today on the Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today on the Calander</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Your schedule for the day</Text>
          
          <View style={styles.eventsList}>
            {mockData.todayEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Video size={20} color="#17f196" fill="#17f196" />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventAttendees}>
                    <View style={styles.attendeeAvatars}>
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar1]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar2]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar3]} />
                    </View>
                    <Text style={styles.attendeeCount}>+{event.attendees - 3}</Text>
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Pressable style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Meet</Text>
                  </Pressable>
                </View>
              </View>
            ))}
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
          
          <View style={styles.tasksList}>
            {mockData.todayTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskIcon}>
                  <Zap size={20} color="#17f196" fill="#17f196" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskStatusRow}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{task.status}</Text>
                    </View>
                    <View style={[styles.priorityBadge, styles.priorityHigh]}>
                      <Text style={styles.priorityBadgeText}>{task.priority}</Text>
                    </View>
                  </View>
                  <View style={styles.taskAttendees}>
                    <View style={styles.attendeeAvatars}>
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar1]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar2]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar3]} />
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <View style={styles.calendarIcon}>
                    <Calendar size={16} color="#17f196" fill="#17f196" />
                  </View>
                  <Text style={styles.dueDate}>{task.dueDate}</Text>
                </View>
              </View>
            ))}
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
          
          <View style={styles.eventsList}>
            {mockData.todayEvents.map((event) => (
              <View key={`shopping-${event.id}`} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Video size={20} color="#17f196" fill="#17f196" />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventAttendees}>
                    <View style={styles.attendeeAvatars}>
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar1]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar2]} />
                      <View style={[styles.attendeeAvatar, styles.attendeeAvatar3]} />
                    </View>
                    <Text style={styles.attendeeCount}>+{event.attendees - 3}</Text>
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Pressable style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Meet</Text>
                  </Pressable>
                </View>
              </View>
            ))}
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Section
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#000000',
  },
  verifiedIcon: {
    // Verified checkmark styling
  },
  userRole: {
    fontSize: 14,
    color: '#17f196',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flamesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17f196',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  flamesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Styling
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  badge: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    gap: 16,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionCardDisabled: {
    opacity: 0.6,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconDisabled: {
    backgroundColor: '#E0E0E0',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  quickActionTitleDisabled: {
    color: '#999999',
  },
  quickActionContent: {
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusPillActive: {
    backgroundColor: '#17f196',
  },
  statusPillDisabled: {
    backgroundColor: '#F0F0F0',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  statusPillTextDisabled: {
    color: '#999999',
  },
  quickActionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastAddedText: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#17f196',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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

  // Tasks List
  tasksList: {
    gap: 12,
  },
  taskCard: {
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
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  taskStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priorityHigh: {
    backgroundColor: '#FF6B6B',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskAttendees: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17f196',
    borderRadius: 2,
  },
  taskActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  calendarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
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