import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  Alert,
  Image as RNImage,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Users, Crown, Calendar, UserPlus, ArrowRight, Activity, CircleCheck as CheckCircle, TrendingUp, Heart, Sparkles, Copy, Check, X, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealTimeFamily } from '@/hooks/useRealTimeFamily';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyCalendarEvents } from '@/hooks/useFamilyCalendarEvents';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';

const { width: screenWidth } = Dimensions.get('window');

export default function FamilyDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { isInFamily, currentFamily, familyMembers, loading: familyLoading, refreshFamily, retryConnection, error } = useFamily();
  
  const { user, profile, session } = useAuth();
  
  // Get data from hooks
  const { tasks: familyTasks } = useFamilyTasks();
  const { events: familyEvents } = useFamilyCalendarEvents();
  const { items: shoppingItems } = useFamilyShoppingItems();
  
  // Calculate completion percentage for family challenge
  const calculateCompletionPercentage = useCallback(() => {
    const currentTime = new Date();
    
    // Calculate completed tasks
    const completedTasks = familyTasks.filter(task => task.completed).length;
    const totalTasks = familyTasks.length;
    
    // Calculate completed events (endtime > current time means completed)
    const completedEvents = familyEvents.filter(event => {
      if (!event.end_date) {
        // If no end_date, check if event_date has passed
        return new Date(event.event_date) < currentTime;
      }
      return new Date(event.end_date) < currentTime;
    }).length;
    const totalEvents = familyEvents.length;
    
    // Calculate completed shopping items
    const completedShoppingItems = shoppingItems.filter(item => item.completed).length;
    const totalShoppingItems = shoppingItems.length;
    
    // Calculate total completed and total items
    const totalCompleted = completedTasks + completedEvents + completedShoppingItems;
    const totalItems = totalTasks + totalEvents + totalShoppingItems;
    
    // Calculate percentage
    const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    
    return {
      percentage,
      completedTasks,
      totalTasks,
      completedEvents,
      totalEvents,
      completedShoppingItems,
      totalShoppingItems,
      totalCompleted,
      totalItems
    };
  }, [familyTasks, familyEvents, shoppingItems]);
  
  const completionStats = calculateCompletionPercentage();
  
  // Debug: Log family data
  useEffect(() => {
    console.log('🔍 Family page - currentFamily:', currentFamily);
    console.log('🔍 Family page - isInFamily:', isInFamily);
    console.log('🔍 Family page - familyLoading:', familyLoading);
    console.log('🔍 Family page - familyMembers:', familyMembers);
    console.log('🔍 Family page - familyMembers length:', familyMembers?.length || 0);
    if (familyMembers && familyMembers.length > 0) {
      console.log('🔍 Family page - familyMembers details:');
      familyMembers.forEach((member, index) => {
        console.log(`  Member ${index + 1}:`, {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          name: member.profiles?.name || 'No name',
          avatar_url: member.profiles?.avatar_url || 'No avatar'
        });
      });
    }
  }, [currentFamily, isInFamily, familyLoading, familyMembers]);
  
  // Refresh family data when component mounts
  useEffect(() => {
    const refreshFamilyData = async () => {
      try {
        console.log('🔄 Family page: Refreshing family data on mount...');
        await refreshFamily();
        console.log('✅ Family page: Family data refreshed');
        
        // Additional direct refresh of family members if we have a family
        if (currentFamily && user && session?.access_token) {
          console.log('🔄 Family page: Additional direct family members refresh...');
          try {
            // Removed family_members API call
            const response = { ok: false, json: () => Promise.resolve([]) };
            
            if (response.ok) {
              const membersData = await response.json();
              console.log('✅ Family page: Direct family members refresh successful:', membersData);
              console.log('✅ Family page: Found', membersData.length, 'family members');
            } else {
              console.log('⚠️ Family page: Direct family members refresh failed - API call removed');
            }
          } catch (directRefreshError) {
            console.log('⚠️ Family page: Direct family members refresh error:', directRefreshError);
          }
        }
      } catch (error) {
        console.log('⚠️ Family page: Family data refresh failed:', error);
      }
    };
    
    refreshFamilyData();
  }, []); // Run once on mount
  
  // Real-time family data with online status
  const { isUserOnline, onlineMembers: realTimeOnlineMembers } = useRealTimeFamily(currentFamily?.id || null);
  
  // Simple online status logic: current user is always online, others are offline
  const getMemberOnlineStatus = (memberUserId: string) => {
    // Current user is always online
    if (memberUserId === user?.id) {
      return true;
    }
    // For demo purposes, show some members as online
    // You can modify this logic as needed
    return false;
  };
  
  // Debug: Log online status for each member
  console.log('🔍 Real-time online members:', Array.from(realTimeOnlineMembers));
  console.log('🔍 Current user ID:', user?.id);
  familyMembers.forEach((member, index) => {
    const isOnline = getMemberOnlineStatus(member.user_id);
    console.log(`🔍 Member ${index + 1} (${member.profiles?.name}): ${isOnline ? 'ONLINE' : 'OFFLINE'} (user_id: ${member.user_id})`);
  });
  const { recentActivities } = useFamilyPoints();
  const { t } = useLanguage();

  // Get family data counts
  const { tasks, loading: tasksLoading } = useFamilyTasks();
  const { events, loading: eventsLoading } = useFamilyCalendarEvents();
  const { items, loading: itemsLoading } = useFamilyShoppingItems();


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing family data...');
      await refreshFamily();
    } catch (error) {
      console.error('Error refreshing family data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!currentFamily?.code) return;
    
    try {
      // Copy to clipboard using Expo Clipboard
      await Clipboard.setStringAsync(currentFamily.code);
      
      // Show success feedback
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy code:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('tabs.family.copyError') || 'Failed to copy code to clipboard'
      );
    }
  };

  const handleInvitePress = () => {
    setShowInviteModal(true);
  };

  // Calculate simple stats
  const stats = useMemo(() => {
    console.log('📊 Calculating stats with familyMembers:', familyMembers.length, familyMembers);
    console.log('📊 Online members from real-time:', realTimeOnlineMembers.size);
    console.log('📊 Tasks count:', tasks.length);
    console.log('📊 Events count:', events.length);
    console.log('📊 Shopping items count:', items.length);
    
    // Calculate online count using simple logic
    const onlineCount = familyMembers.filter(member => getMemberOnlineStatus(member.user_id)).length;
    console.log('📊 Online members count:', onlineCount);
    
    // Calculate task counts
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    
    // Calculate event counts (all events, not just upcoming)
    const totalEvents = events.length;
    
    // Calculate shopping item counts
    const completedShoppingItems = items.filter(item => item.completed).length;
    const totalShoppingItems = items.length;
    
    return {
      totalMembers: familyMembers.length,
      onlineMembers: onlineCount, // Use simple online status logic
      weeklyProgress: familyMembers.length > 0 ? Math.min(95, 60 + (familyMembers.length * 10)) : 0,
      completedTasks,
      totalTasks,
      totalEvents,
      completedShoppingItems,
      totalShoppingItems,
    };
  }, [familyMembers.length, realTimeOnlineMembers.size, user?.id, tasks, events, items]);
  // Show error state if there's an error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          
          {/* Add helpful instructions for connectivity issues */}
          {error.includes('Connection failed') && (
            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>Troubleshooting Tips:</Text>
              <Text style={styles.helpText}>• Check your internet connection</Text>
              <Text style={styles.helpText}>• Make sure your Supabase project is active</Text>
              <Text style={styles.helpText}>• Try refreshing the page</Text>
            </View>
          )}
          
          <Pressable style={styles.retryButton} onPress={() => retryConnection()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { totalMembers, onlineMembers, weeklyProgress, completedTasks, totalTasks, totalEvents, completedShoppingItems, totalShoppingItems } = stats;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {false ? (
                <Image 
                  source={{ uri: '' }} 
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentFamily?.name?.charAt(0).toUpperCase() || 'F'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{currentFamily?.name || "Family"}</Text>
                <Image
                  source={require('@/assets/images/icon/verification.png')}
                  style={styles.verifiedIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.userRole}>Welcome to our family!</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.linkIconContainer}>
              <View style={styles.linkIcon}>
                <Image
                  source={require('@/assets/images/icon/link.png')}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain'
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#17f196"
          />
        }
      >

        {/* === FAMILY PROGRESS BANNER === */}
        <View style={styles.section}>
          <View style={styles.workSummaryBanner}>
            <View style={styles.workSummaryContent}>
              <View style={styles.workSummaryText}>
                <Text style={styles.workSummaryTitle}>Family Progress</Text>
                <Text style={styles.workSummarySubtitle}>Together we can achieve more!</Text>
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
        </View>

        {/* === FAMILY OVERVIEW === */}
        <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Overview</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Here are your top activities</Text>
          
          <View style={styles.quickActionsGrid}>
            {/* Tasks */}
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionNumber}>{totalTasks}</Text>
              </View>
              <Text style={styles.quickActionTitle}>Tasks</Text>
              <Text style={styles.quickActionSubtitle}>Total</Text>
            </Pressable>

            {/* Calendar */}
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionNumber}>{totalEvents}</Text>
              </View>
              <Text style={styles.quickActionTitle}>Calendar</Text>
              <Text style={styles.quickActionSubtitle}>Events</Text>
            </Pressable>

            {/* Shop List */}
            <Pressable style={styles.quickActionButton}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionNumber}>{totalShoppingItems}</Text>
              </View>
              <Text style={styles.quickActionTitle}>Shop List</Text>
              <Text style={styles.quickActionSubtitle}>Items</Text>
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

        {/* === FAMILY CHALLENGE === */}
        <View style={styles.section}>
          <View style={styles.futuresElementsPanel}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Challenge</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{completionStats.percentage}%</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Complete all family activities to reach 100%</Text>
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
                <Text style={styles.taskTitle}>Family Activity Challenge</Text>
              </View>
              
              <View style={styles.taskTags}>
                <View style={styles.statusTag}>
                  <View style={styles.taskDot} />
                  <Text style={styles.taskText}>
                    {completionStats.totalCompleted} of {completionStats.totalItems} activities completed
                  </Text>
                </View>
              </View>
              
              <View style={styles.challengeProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${completionStats.percentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{completionStats.percentage}% Complete</Text>
              </View>
              
              <View style={styles.challengeStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tasks</Text>
                  <Text style={styles.statValue}>{completionStats.completedTasks}/{completionStats.totalTasks}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Events</Text>
                  <Text style={styles.statValue}>{completionStats.completedEvents}/{completionStats.totalEvents}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Shopping</Text>
                  <Text style={styles.statValue}>{completionStats.completedShoppingItems}/{completionStats.totalShoppingItems}</Text>
                </View>
              </View>
              
              <View style={styles.challengeFooter}>
                <View style={styles.participants}>
                  {familyMembers.slice(0, 3).map((member, index) => (
                    <View key={member.id} style={styles.participantAvatar}>
                      <Text style={styles.participantAvatarText}>
                        {member.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.reward}>
                  <Image
                    source={require('@/assets/images/icon/flames_active.png')}
                    style={styles.flameIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.rewardText}>+{completionStats.totalCompleted * 10} Flames</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* === FAMILY MEMBERS === */}
        <View style={styles.section}>
          <View style={styles.futuresElementsPanel}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Members</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{familyMembers ? familyMembers.length : 0}</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Alle Family Members are here listed</Text>
            
            <View style={styles.memberCards}>
              {familyMembers && familyMembers.length > 0 ? (
                familyMembers.slice(0, 4).map((member, index) => {
                  const memberName = member.profiles?.name || 'Unknown Member';
                  const nameParts = memberName.split(' ');
                  const firstName = nameParts[0] || 'Unknown';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
                  
                  console.log(`🔍 Rendering member ${index + 1}:`, {
                    user_id: member.user_id,
                    name: memberName,
                    firstName,
                    lastName,
                    initials,
                    role: member.role,
                    hasAvatar: !!member.profiles?.avatar_url
                  });
                  
                  return (
                    <View key={member.user_id || index} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        {member.profiles?.avatar_url ? (
                          <Image
                            source={{ uri: member.profiles.avatar_url }}
                            style={styles.memberAvatarImage}
                            onError={(error) => {
                              console.log('❌ Avatar load error for member:', memberName, error);
                            }}
                          />
                        ) : (
                          <Text style={styles.memberAvatarText}>{initials}</Text>
                        )}
                      </View>
                      <Text style={styles.memberName}>{firstName}</Text>
                      <Text style={styles.memberLastName}>{lastName}</Text>
                      <Text style={styles.memberRole}>{member.role === 'admin' ? 'Admin' : 'Member'}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>?</Text>
                  </View>
                  <Text style={styles.memberName}>No</Text>
                  <Text style={styles.memberLastName}>Members</Text>
                  <Text style={styles.memberRole}>Found</Text>
                </View>
              )}
              
              {(!familyMembers || familyMembers.length < 4) && (
                <Pressable style={styles.inviteMemberCard} onPress={handleInvitePress}>
                  <View style={styles.inviteIcon}>
                    <Image
                      source={require('@/assets/images/icon/link_dis.png')}
                      style={{
                        width: 18,
                        height: 18,
                        resizeMode: 'contain'
                      }}
                    />
                  </View>
                  <Text style={styles.inviteTitle}>Invite</Text>
                  <Text style={styles.inviteSubtitle}>Member</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>


        {/* Bottom Spacing für Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setShowInviteModal(false)} 
          />
          <View style={styles.inviteModal}>
            {/* Header */}
            <View style={styles.inviteModalHeader}>
              <Text style={styles.inviteModalTitle}>{t('family.invite.title')}</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowInviteModal(false)}
              >
                <X size={20} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Code Display */}
            <View style={styles.codeDisplayContainer}>
              <Text style={styles.codeLabel}>{t('family.invite.codeLabel')}</Text>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{currentFamily?.code || 'ABC123'}</Text>
              </View>
            </View>

            {/* Copy Button */}
            <Pressable
              style={[styles.copyButton, copySuccess && styles.copyButtonSuccess]}
              onPress={handleCopyInviteCode}
            >
              {copySuccess ? (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.copyButtonTextSuccess}>{t('common.copied')}</Text>
                </>
              ) : (
                <>
                  <Copy size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.copyButtonText}>{t('family.invite.copyCode')}</Text>
                </>
              )}
            </Pressable>

            {/* Instructions */}
            <Text style={styles.inviteInstructions}>
              {t('family.invite.instructions')}
            </Text>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    marginBottom: 4,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#17f196',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
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
    width: 16,
    height: 16,
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
  linkIconContainer: {
    // Container for link icon
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9fff6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === SECTIONS ===
  section: {
    marginTop: 8,
    paddingHorizontal: 0,
    // marginBottom: 8,
  },
  futuresElementsPanel: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 8,
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
    color: '#2d2d2d',
  },
  badge: {
    backgroundColor: '#e9fff6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    marginBottom: 16,
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

  // === FAMILY PROGRESS BANNER ===
  familyProgressBanner: {
    backgroundColor: '#17f196',
    borderRadius: 16,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  bannerIcon: {
    marginLeft: 16,
  },
  sparklingCameraIcon: {
    width: 40,
    height: 40,
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
  quickActionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2d2d2d',
    textAlign: 'center',
  },
  quickActionTitleDisabled: {
    color: '#999999',
  },
  quickActionSubtitle: {
    fontSize: 8,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  quickActionSubtitleDisabled: {
    color: '#999999',
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

  // === CHALLENGE CARD ===
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  challengeTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
    marginRight: 8,
  },
  taskText: {
    fontSize: 14,
    color: '#666666',
  },
  challengeProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17f196',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#17f196',
    textAlign: 'center',
    marginTop: 4,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participants: {
    flexDirection: 'row',
    gap: 4,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#040404',
  },

  // === MEMBER CARDS ===
  memberCards: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  memberCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
    minWidth: 80,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFB6C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 2,
  },
  memberLastName: {
    fontSize: 12,
    color: '#666666',
  },
  memberRole: {
    fontSize: 10,
    color: '#17f196',
    fontWeight: '500',
    marginTop: 2,
  },
  inviteMemberCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  inviteIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 2,
  },
  inviteSubtitle: {
    fontSize: 12,
    color: '#999999',
  },


  // === BOTTOM SPACING ===
  bottomSpacing: {
    height: 80,
  },

  // === INVITE MODAL ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inviteModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  inviteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  inviteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#040404',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeDisplayContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    // fontFamily: 'Montserrat-Medium',
    color: '#666666',
    marginBottom: 12,
  },
  codeDisplay: {
    // backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'rgb(70, 103, 89)',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 28,
    // fontFamily: 'Montserrat-Bold',
    color: 'rgb(70, 103, 89)',
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  copyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#17f196',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#17f196',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  copyButtonSuccess: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  copyButtonText: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  copyButtonTextSuccess: {
    fontSize: 14,
    fontStyle: 'medium',
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  inviteInstructions: {
    fontSize: 14,
    color: '#466759',
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
  },
  noMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noMembersText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#17f196',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#161618',
  },
});