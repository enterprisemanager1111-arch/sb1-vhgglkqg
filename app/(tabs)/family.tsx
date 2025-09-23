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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated';
import { Users, Crown, Calendar, UserPlus, ArrowRight, Activity, CircleCheck as CheckCircle, TrendingUp, Heart, Sparkles, Copy, Check, X, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import FamilyPrompt from '@/components/FamilyPrompt';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealTimeFamily } from '@/hooks/useRealTimeFamily';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth } = Dimensions.get('window');

export default function FamilyDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { isInFamily, currentFamily, familyMembers, loading: familyLoading, refreshFamily, retryConnection, error } = useFamily();
  
  const { user, profile } = useAuth();
  
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

  // Animation Values
  const headerOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.9);
  const statsTranslateY = useSharedValue(30);
  const membersOpacity = useSharedValue(0);
  const actionsScale = useSharedValue(0.8);

  // Animation effects
  useEffect(() => {
    if (!isLoaded && !familyLoading) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      heroScale.value = withDelay(200, withSpring(1, { damping: 18, stiffness: 150 }));
      statsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 200 }));
      membersOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      actionsScale.value = withDelay(800, withSpring(1, { damping: 25, stiffness: 100 }));
      setIsLoaded(true);
    }
  }, [isLoaded, familyLoading]);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsTranslateY.value }],
    opacity: statsTranslateY.value === 0 ? 1 : 0.7,
  }));

  const membersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: membersOpacity.value,
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: actionsScale.value }],
  }));

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
    
    // Calculate online count using simple logic
    const onlineCount = familyMembers.filter(member => getMemberOnlineStatus(member.user_id)).length;
    console.log('📊 Online members count:', onlineCount);
    
    return {
      totalMembers: familyMembers.length,
      onlineMembers: onlineCount, // Use simple online status logic
      weeklyProgress: familyMembers.length > 0 ? Math.min(95, 60 + (familyMembers.length * 10)) : 0,
      completedTasks: familyMembers.length * 2, // 2 tasks per member on average
      totalTasks: familyMembers.length * 3, // 3 tasks per member target
      upcomingEvents: Math.max(1, familyMembers.length), // At least 1 event per member
    };
  }, [familyMembers.length, realTimeOnlineMembers.size, user?.id]);
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

  const { totalMembers, onlineMembers, weeklyProgress, completedTasks, totalTasks, upcomingEvents } = stats;

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image */}
      <RNImage 
        source={require('@/assets/images/newImg/background.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#54FE54"
          />
        }
      >
        {/* === HEADER === */}
        <AnimatedView style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerTop}>
            <View style={styles.familyInfo}>
              <Text style={styles.familyGreeting}>{t('nav.family')}</Text>
              <Text style={styles.familyName}>{currentFamily?.name || 'My Family'}</Text>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.realTimeIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.realTimeText}>Live</Text>
              </View>
            </View>
          </View>
          <View style={styles.familyMeta}>
            <Text style={styles.familyCode}>#{currentFamily?.code}</Text>
            <View style={styles.memberCountContainer}>
              <Users size={14} color="#666666" strokeWidth={2} />
              <Text style={styles.memberCountText}>
                {t('family.members.count', { 
                  count: totalMembers.toString(), 
                  memberText: totalMembers === 1 ? 'member' : 'members' 
                })}
                {onlineMembers > 0 && (
                  <Text style={styles.onlineCount}> • {onlineMembers} online</Text>
                )}
              </Text>
            </View>
          </View>
        </AnimatedView>

        {/* === HERO STATS CARD === */}
        <AnimatedView style={[styles.section, heroAnimatedStyle]}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{t('family.weeklyProgress.title')}</Text>
                <Text style={styles.heroSubtitle}>{t('family.weeklyProgress.subtitle')}</Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercentage}>{weeklyProgress}%</Text>
                <Text style={styles.progressLabel}>{t('common.completed')}</Text>
              </View>
            </View>
            
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <CheckCircle size={16} color="#161618" strokeWidth={2} />
                <Text style={styles.heroStatText}>
                  {t('family.stats.tasks', { completed: completedTasks.toString(), total: totalTasks.toString() })}
                </Text>
              </View>
              <View style={styles.heroStatItem}>
                <Calendar size={16} color="#161618" strokeWidth={2} />
                <Text style={styles.heroStatText}>
{t('family.stats.appointments', { count: upcomingEvents.toString() })}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* === QUICK STATS === */}
        <AnimatedView style={[styles.section, statsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>{t('family.overview.title')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CheckCircle size={20} color="#54FE54" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{completedTasks}</Text>
              <Text style={styles.statLabel}>{t('common.completed')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={20} color="#54FE54" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{upcomingEvents}</Text>
              <Text style={styles.statLabel}>{t('family.stats.appointmentsLabel')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Activity size={20} color="#54FE54" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{onlineMembers}</Text>
              <Text style={styles.statLabel}>{t('family.stats.online')}</Text>
            </View>
          </View>
        </AnimatedView>

        {/* === FAMILIENMITGLIEDER PREVIEW === */}
        <AnimatedView style={[styles.section, membersAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('family.members.title')}</Text>
            <Pressable 
              style={styles.seeAllButton}
              onPress={() => router.push('/family/members')}
            >
              <Text style={styles.seeAllText}>{t('common.showAll')}</Text>
              <ArrowRight size={16} color="#54FE54" strokeWidth={2} />
            </Pressable>
          </View>
          
          {/* Individual Member Cards (Option B) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.membersScroll}
            contentContainerStyle={styles.membersScrollContent}
          >
            {familyMembers.length === 0 ? (
              <View style={styles.noMembersContainer}>
                <Text style={styles.noMembersText}>
                  {familyLoading ? t('family.members.loading') : t('family.members.empty')}
                </Text>
                {!familyLoading && (
                  <Pressable style={styles.refreshButton} onPress={refreshFamily}>
                    <Text style={styles.refreshButtonText}>{t('common.refresh')}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              familyMembers.map((member, index) => {
              
              // Calculate member stats from real data
              const memberActivities = recentActivities.filter(a => a.user_id === member.user_id);
              const memberPoints = memberActivities.reduce((sum, activity) => sum + activity.points_earned, 0);
              const memberTasks = memberActivities.filter(a => a.activity_type === 'task_completed').length;
              
              return (
                <View key={member.id} style={styles.memberDetailCard}>
                  {/* Member Avatar */}
                  <View style={styles.memberAvatarContainer}>
                    {member.profiles?.avatar_url ? (
                      <Image 
                        source={{ uri: member.profiles.avatar_url }} 
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>
                          {member.profiles?.name?.charAt(0).toUpperCase() || 'M'}
                        </Text>
                      </View>
                    )}
                    
                    {/* Online Status */}
                    <View style={[
                      styles.onlineStatus,
                      { backgroundColor: getMemberOnlineStatus(member.user_id) ? '#54FE54' : '#E0E0E0' }
                    ]} />
                    
                    {/* Admin Badge */}
                    {member.role === 'admin' && (
                      <View style={styles.adminBadge}>
                        <Crown size={10} color="#FFB800" strokeWidth={2} fill="#FFB800" />
                      </View>
                    )}
                  </View>
                  
                  {/* Member Info */}
                  <View style={styles.memberDetailInfo}>
                    <Text style={styles.memberDetailName} numberOfLines={1}>
                      {member.profiles?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.memberDetailRole}>
{member.role === 'admin' ? t('family.members.role.admin') : t('family.members.role.member')}
                    </Text>
                  </View>
                  
                  {/* Member Stats */}
                  <View style={styles.memberDetailStats}>
                    <View style={styles.memberDetailStatItem}>
                      <Text style={styles.memberDetailStatNumber}>{memberPoints}</Text>
                      <Text style={styles.memberDetailStatLabel}>{t('common.points')}</Text>
                    </View>
                    <View style={styles.memberDetailStatDivider} />
                    <View style={styles.memberDetailStatItem}>
                      <Text style={styles.memberDetailStatNumber}>{memberTasks}</Text>
                      <Text style={styles.memberDetailStatLabel}>{t('common.tasks')}</Text>
                    </View>
                  </View>
                  
                  {/* Quick Action */}
                  <Pressable 
                    style={styles.memberDetailAction}
                    onPress={() => {
                      // Navigate to assign task
                      router.push('/(tabs)/tasks');
                    }}
                  >
                    <Text style={styles.memberDetailActionText}>{t('family.members.assignTask')}</Text>
                  </Pressable>
                </View>
              );
              })
            )}
            
            {/* Add Member Card */}
            <Pressable 
              style={styles.addMemberCard}
              onPress={handleInvitePress}
            >
              <View style={styles.addMemberIcon}>
                <UserPlus size={24} color="#54FE54" strokeWidth={2} />
              </View>
              <Text style={styles.addMemberTitle}>{t('family.members.invite')}</Text>
              <Text style={styles.addMemberSubtitle}>{t('family.members.expand')}</Text>
              <Pressable 
                style={styles.addMemberButton}
                onPress={handleInvitePress}
              >
                <Text style={styles.addMemberButtonText}>{t('family.members.invite')}</Text>
              </Pressable>
            </Pressable>
          </ScrollView>
        </AnimatedView>

        {/* === FAMILIENEINBLICKE === */}
        <AnimatedView style={[styles.section, actionsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>{t('family.insights.title')}</Text>
          <View style={styles.insightsCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <TrendingUp size={20} color="#161618" strokeWidth={2} />
              </View>
              <View style={styles.insightInfo}>
                <Text style={styles.insightTitle}>{t('family.insights.thisWeek')}</Text>
                <Text style={styles.insightSubtitle}>{t('family.insights.greatTeamwork')}</Text>
              </View>
              <View style={styles.insightBadge}>
                <Heart size={14} color="#54FE54" strokeWidth={2} fill="#54FE54" />
              </View>
            </View>
            <Text style={styles.insightDescription}>
              {totalMembers > 1 && onlineMembers > 0 
                ? t('family.insights.descriptionWithOnline', { 
                    completedTasks: completedTasks.toString(), 
                    upcomingEvents: upcomingEvents.toString(), 
                    onlineMembers: onlineMembers.toString() 
                  })
                : t('family.insights.description', { 
                    completedTasks: completedTasks.toString(), 
                    upcomingEvents: upcomingEvents.toString() 
                  })
              } 🎉
            </Text>
            <View style={styles.insightStats}>
              <View style={styles.insightStatItem}>
                <Trophy size={14} color="#54FE54" strokeWidth={2} />
                <Text style={styles.insightStatText}>{t('family.insights.achievements', { count: completedTasks.toString() })}</Text>
              </View>
              <View style={styles.insightStatItem}>
                <Sparkles size={14} color="#54FE54" strokeWidth={2} />
                <Text style={styles.insightStatText}>{t('family.insights.pointsCollected', { points: (completedTasks * 15).toString() })}</Text>
              </View>
            </View>
          </View>
        </AnimatedView>

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
                  <Copy size={18} color="#161618" strokeWidth={2} />
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
    backgroundColor: '#102118',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#102118',
    opacity: 0.7,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
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
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#54FE54',
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

  // === HEADER ===
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  familyInfo: {
    flex: 1,
  },
  familyGreeting: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  familyName: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#54FE54',
  },
  realTimeText: {
    fontSize: 11,
    fontFamily: 'Montserrat-SemiBold',
    color: '#54FE54',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  familyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  onlineCount: {
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  familyCode: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // === SECTIONS ===
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Medium',
    color: '#54FE54',
  },

  // === HERO CARD ===
  heroCard: {
    backgroundColor: '#54FE54',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#161618',
    opacity: 0.8,
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(22, 22, 24, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat-Medium',
    color: '#161618',
    opacity: 0.8,
  },
  heroStats: {
    gap: 12,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#161618',
    opacity: 0.9,
  },

  // === STATS GRID ===
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
    textAlign: 'center',
  },

  // === MITGLIEDER PREVIEW ===
  membersScroll: {
    marginHorizontal: -20,
  },
  membersScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  
  // === DETAILED MEMBER CARDS (Option B) ===
  memberDetailCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  memberDetailInfo: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  memberDetailName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    marginBottom: 2,
  },
  memberDetailRole: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  memberDetailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: '100%',
  },
  memberDetailStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  memberDetailStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  memberDetailStatLabel: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  memberDetailStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  memberDetailAction: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  memberDetailActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
  memberAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(84, 254, 84, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  adminBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addMemberCard: {
    width: 140,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    borderStyle: 'dashed',
  },
  addMemberTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  addMemberSubtitle: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    marginBottom: 12,
  },
  addMemberButton: {
    backgroundColor: '#54FE54',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addMemberButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
  addMemberIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(84, 254, 84, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  // === EINBLICKE CARD ===
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
    marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
  },
  insightBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    lineHeight: 22,
    marginBottom: 12,
  },
  insightStats: {
    flexDirection: 'row',
    gap: 12,
  },
  insightStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightStatText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
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
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
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
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
    marginBottom: 12,
  },
  codeDisplay: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#54FE54',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: '#161618',
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#54FE54',
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
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  copyButtonTextSuccess: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFFFFF',
  },
  inviteInstructions: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
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
    backgroundColor: '#54FE54',
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