import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  withDelay, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { Flame, Trophy, TrendingUp, Target, Star, Crown, Medal, Award, Plus, Calendar, CircleCheck as CheckCircle, ArrowUp, ArrowDown, Zap, Gift, Activity, ChartBar as BarChart3, X, Users } from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useFamilyPoints, POINTS_CONFIG, getAchievementsConfig } from '@/hooks/useFamilyPoints';
import { getCurrentLevel, getNextLevel, getLevelProgress, FAMILY_LEVELS } from '@/hooks/useFamilyPoints';
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem';
import FamilyPrompt from '@/components/FamilyPrompt';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FlamesScreen() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('100');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const { isInFamily, familyMembers, loading: familyLoading, refreshFamily } = useFamily();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { showLoading, hideLoading } = useLoading();
  const {
    leaderboard,
    currentUserRank,
    currentUserPoints,
    recentActivities,
    activeGoals,
    achievements,
    userAchievements,
    loading: pointsLoading,
    error: pointsError,
    createGoal,
    awardPoints,
    refreshData,
    getPointsForPeriod,
  } = useFamilyPoints();
  
  // Calculate family total points for level system
  const familyTotalPoints = leaderboard.reduce((sum, member) => sum + member.total_points, 0);
  const currentFamilyLevel = getCurrentLevel(familyTotalPoints);
  const nextFamilyLevel = getNextLevel(familyTotalPoints);
  const levelProgress = getLevelProgress(familyTotalPoints);
  
  // Calculate family achievements
  const familyCompletedTasks = recentActivities.filter(a => a.activity_type === 'task_completed').length;
  const familyCompletedShopping = recentActivities.filter(a => a.activity_type === 'shopping_item_completed').length;
  const familyCreatedEvents = recentActivities.filter(a => a.activity_type === 'event_created').length;
  
  const {
    notifications,
    dismissNotification,
    showPointsEarned,
    showAchievementUnlocked,
    showGoalCompleted,
    showMemberActivity,
  } = useNotifications();
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const userStatsScale = useSharedValue(0.8);
  const leaderboardTranslateY = useSharedValue(30);
  const goalsOpacity = useSharedValue(0);
  const achievementsScale = useSharedValue(0.9);
  const flameRotation = useSharedValue(0);

  // Animated styles - moved to top level
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const userStatsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: userStatsScale.value }],
  }));

  const leaderboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: leaderboardTranslateY.value }],
  }));

  const goalsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: goalsOpacity.value,
  }));

  const achievementsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: achievementsScale.value }],
  }));

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flameRotation.value}deg` }],
  }));

  useEffect(() => {
    if (!isLoaded && !familyLoading && !pointsLoading) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      userStatsScale.value = withDelay(200, withSpring(1, { damping: 15 }));
      leaderboardTranslateY.value = withDelay(400, withSpring(0, { damping: 18 }));
      goalsOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      achievementsScale.value = withDelay(800, withSpring(1, { damping: 20 }));
      setIsLoaded(true);
      
      // Flame animation
      flameRotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 2000 }),
          withTiming(-5, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [isLoaded, familyLoading, pointsLoading]);

  // Show family prompt if user is not in a family
  if (!familyLoading && !isInFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <FamilyPrompt />
      </SafeAreaView>
    );
  }

  // Show loading while data is being fetched
  if (familyLoading || pointsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingFlame}>
            <Flame size={32} color="#54FE54" strokeWidth={2} />
          </View>
          <Text style={styles.loadingText}>{t('flames.loading') || 'Loading flames...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (pointsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t('flames.error.title') || 'Error'}</Text>
          <Text style={styles.errorText}>{pointsError}</Text>
          <Pressable style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>{t('flames.error.retry') || 'Try again'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshFamily(),
        refreshData(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert(t('common.error'), t('flames.goal.error.name'));
      return;
    }

    const targetPoints = parseInt(newGoalTarget);
    if (isNaN(targetPoints) || targetPoints <= 0) {
      Alert.alert(t('common.error'), t('flames.goal.error.points'));
      return;
    }

    showLoading('Creating goal...');
    try {
      await createGoal({
        title: newGoalTitle.trim(),
        description: `${t('flames.goal.description')} ${targetPoints}`,
        target_points: targetPoints,
      });
      
      setNewGoalTitle('');
      setNewGoalTarget('100');
      setShowGoalModal(false);
      
      showMemberActivity(profile?.name || t('common.familyMember'), `${t('flames.goal.created')} ${newGoalTitle}`);
      hideLoading();
    } catch (error: any) {
      Alert.alert(t('common.error'), t('flames.goal.error.create') + ' ' + error.message);
      hideLoading();
    }
  };

  // Calculate period-specific points for leaderboard
  const periodLeaderboard = leaderboard.map(entry => ({
    ...entry,
    period_points: selectedPeriod === 'all' ? entry.total_points : getPointsForPeriod(entry.user_id, selectedPeriod === 'week' ? 7 : 30),
  })).sort((a, b) => b.period_points - a.period_points);

  // Get user's stats for selected period
  const currentUserPeriodPoints = selectedPeriod === 'all' ? currentUserPoints : getPointsForPeriod(user?.id || '', selectedPeriod === 'week' ? 7 : 30);
  const currentUserPeriodRank = periodLeaderboard.findIndex(entry => entry.user_id === user?.id) + 1;


  return (
    <SafeAreaView style={styles.container}>
      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />

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
        {/* Header */}
        <AnimatedView style={[styles.header, headerAnimatedStyle]}>
          <Text style={styles.title}>{t('flames.title')}</Text>
          <Text style={styles.subtitle}>
            {familyTotalPoints.toLocaleString('de-DE')} {t('flames.subtitle')}
          </Text>
        </AnimatedView>

        {/* User Stats Card with Period Selection */}
        <AnimatedView style={[styles.section, userStatsAnimatedStyle]}>
          <View style={styles.userStatsCard}>
            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {(['week', 'month', 'all'] as const).map((period) => (
                <Pressable
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.selectedPeriodButton
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.selectedPeriodButtonText
                  ]}>
                    {period === 'week' ? t('flames.period.week') : period === 'month' ? t('flames.period.month') : t('flames.period.all')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Family Level Preview */}
            <View style={styles.userStatsHeader}>
              <AnimatedView style={[styles.levelIcon, flameAnimatedStyle]}>
                <Flame size={28} color="#54FE54" strokeWidth={2} />
              </AnimatedView>
              <View style={styles.userStatsInfo}>
                <Text style={styles.userStatsName}>{t('flames.family.level')} {currentFamilyLevel.level}</Text>
                <Text style={styles.userStatsRank}>
                  {currentFamilyLevel.title} - {currentFamilyLevel.description}
                </Text>
              </View>
              <View style={styles.userStatsPoints}>
                <Text style={styles.userStatsPointsNumber}>{familyTotalPoints.toLocaleString('de-DE')}</Text>
                <Text style={styles.userStatsPointsLabel}>{t('flames.family.points')}</Text>
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* Family Level Progress - Main Goal System */}
        <AnimatedView style={[styles.section, goalsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color="#54FE54" strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t('flames.family.level')}</Text>
          </View>
          
          <View style={styles.familyLevelCard}>
            {/* Level Header */}
            <View style={styles.familyLevelHeader}>
              <View style={styles.familyLevelIconContainer}>
                <Trophy size={32} color="#54FE54" strokeWidth={2} />
              </View>
              <View style={styles.familyLevelTextContainer}>
                <View style={styles.familyLevelTitleRow}>
                  <Text style={styles.familyLevelCurrentText}>Level {currentFamilyLevel.level}</Text>
                  <View style={styles.familyLevelBadge}>
                    <Text style={styles.familyLevelBadgeText}>{currentFamilyLevel.title}</Text>
                  </View>
                </View>
                <Text style={styles.familyLevelDescription}>{currentFamilyLevel.description}</Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.familyLevelProgressSection}>
              <View style={styles.familyProgressRow}>
                <Text style={styles.familyProgressLabel}>{t('flames.family.progress')}</Text>
                <Text style={styles.familyProgressPoints}>
                  {familyTotalPoints.toLocaleString('de-DE')} {t('dashboard.points')}
                </Text>
              </View>
              
              {/* Progress Bar */}
              {nextFamilyLevel ? (
                <View style={styles.familyProgressBarContainer}>
                  <View style={styles.familyProgressBar}>
                    <View style={[
                      styles.familyProgressFill,
                      { width: `${Math.min(levelProgress.percentage, 100)}%` }
                    ]} />
                  </View>
                  <Text style={styles.familyProgressText}>
                    {(levelProgress.next - familyTotalPoints).toLocaleString('de-DE')} {t('flames.family.progress.points')} {nextFamilyLevel.level}
                  </Text>
                </View>
              ) : (
                <View style={styles.maxLevelContainer}>
                  <View style={styles.maxLevelIcon}>
                    <Crown size={20} color="#FFB800" strokeWidth={2} fill="#FFB800" />
                  </View>
                  <Text style={styles.maxLevelText}>{t('flames.family.maxLevel')}</Text>
                </View>
              )}
            </View>

            {/* Level Rewards Preview */}
            {nextFamilyLevel && (
              <View style={styles.nextLevelPreview}>
                <Text style={styles.nextLevelLabel}>{t('flames.family.nextLevel')}</Text>
                <View style={styles.nextLevelInfo}>
                  <Text style={styles.nextLevelTitle}>Level {nextFamilyLevel.level} - {nextFamilyLevel.title}</Text>
                  <Text style={styles.nextLevelDescription}>{nextFamilyLevel.description}</Text>
                </View>
              </View>
            )}
          </View>
        </AnimatedView>
        {/* Family Leaderboard */}
        <AnimatedView style={[styles.section, leaderboardAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color="#161618" strokeWidth={2} />
            <Text style={styles.sectionTitle}>
              {t('flames.leaderboard.title')} - {selectedPeriod === 'week' ? t('flames.leaderboard.thisWeek') : 
                             selectedPeriod === 'month' ? t('flames.leaderboard.thisMonth') : t('flames.leaderboard.total')}
            </Text>
          </View>
          
          <View style={styles.leaderboardCard}>
            {periodLeaderboard.map((member, index) => {
              const pointsDiff = index > 0 ? periodLeaderboard[index - 1].period_points - member.period_points : 0;
              
              return (
                <View key={member.user_id} style={[
                  styles.leaderboardItem,
                  member.is_current_user && styles.currentUserItem
                ]}>
                  {/* Rank with Icon */}
                  <View style={styles.rankContainer}>
                    {index === 0 ? (
                      <Trophy size={24} color="#54FE54" strokeWidth={2} />
                    ) : index === 1 ? (
                      <Medal size={22} color="#54FE54" strokeWidth={2} />
                    ) : index === 2 ? (
                      <Award size={20} color="#54FE54" strokeWidth={2} />
                    ) : (
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    )}
                  </View>

                  {/* Avatar */}
                  <View style={[
                    styles.memberAvatar,
                    member.is_current_user && styles.currentUserAvatar
                  ]}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                    {member.is_current_user && (
                      <View style={styles.currentUserBadge}>
                        <Star size={8} color="#161618" strokeWidth={2} fill="#161618" />
                      </View>
                    )}
                  </View>

                  {/* Member Info */}
                  <View style={styles.memberInfo}>
                    <Text style={[
                      styles.memberName,
                      member.is_current_user && styles.currentUserName
                    ]}>
                      {member.name} {member.is_current_user && t('flames.leaderboard.you')}
                    </Text>
                    <View style={styles.memberStats}>
                      <Text style={styles.memberStatText}>
                        {member.achievements_count} {t('flames.leaderboard.achievements')} • {member.recent_activities.length} {t('flames.leaderboard.activities')}
                      </Text>
                    </View>
                    
                    {/* Point difference from leader */}
                    {index > 0 && pointsDiff > 0 && (
                      <View style={styles.pointsDiff}>
                        <ArrowUp size={12} color="#666666" strokeWidth={2} />
                        <Text style={styles.pointsDiffText}>-{pointsDiff} {t('flames.leaderboard.pointsToFirst')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Points with Trend */}
                  <View style={styles.memberPointsContainer}>
                    <Text style={[
                      styles.pointsNumber,
                      member.is_current_user && styles.currentUserPoints
                    ]}>
                      {member.period_points}
                    </Text>
                    <Text style={styles.pointsLabel}>{t('flames.leaderboard.points')}</Text>
                    
                    {/* Trend Indicator */}
                    {selectedPeriod !== 'all' && (
                      <View style={styles.trendIndicator}>
                        {getPointsForPeriod(member.user_id, 1) > 0 ? (
                          <ArrowUp size={12} color="#54FE54" strokeWidth={2} />
                        ) : (
                          <ArrowDown size={12} color="#666666" strokeWidth={2} />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </AnimatedView>

        {/* Recent Activities Feed */}
        <AnimatedView style={[styles.section, goalsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color="#161618" strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t('flames.activities.title')}</Text>
          </View>
          
          <View style={styles.activitiesContainer}>
            {recentActivities.slice(0, 8).map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  {activity.activity_type === 'task_completed' && <CheckCircle size={16} color="#54FE54" strokeWidth={2} />}
                  {activity.activity_type === 'shopping_item_completed' && <CheckCircle size={16} color="#00D4FF" strokeWidth={2} />}
                  {activity.activity_type === 'member_added' && <Users size={16} color="#FFB800" strokeWidth={2} />}
                  {activity.activity_type === 'daily_checkin' && <Calendar size={16} color="#54FE54" strokeWidth={2} />}
                  {activity.activity_type === 'event_created' && <Calendar size={16} color="#FF6B6B" strokeWidth={2} />}
                  {activity.activity_type === 'goal_achieved' && <Target size={16} color="#9B59B6" strokeWidth={2} />}
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityUser}>
                    {activity.user_profile?.name || t('flames.activities.unknown')} • {' '}
                    {new Date(activity.created_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                
                <View style={styles.activityPoints}>
                  <Text style={styles.activityPointsText}>+{activity.points_earned}</Text>
                </View>
              </View>
            ))}
            
            {recentActivities.length === 0 && (
              <View style={styles.emptyActivities}>
                <Activity size={32} color="#E0E0E0" strokeWidth={1.5} />
                <Text style={styles.emptyActivitiesText}>{t('flames.activities.empty')}</Text>
                <Text style={styles.emptyActivitiesSubtext}>
                  {t('flames.activities.empty.subtitle')}
                </Text>
              </View>
            )}
          </View>
        </AnimatedView>

        {/* Achievements Grid */}
        <AnimatedView style={[styles.section, achievementsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Star size={20} color="#54FE54" strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t('flames.achievements.title')}</Text>
          </View>
          
          <View style={styles.achievementsGrid}>
            {Object.entries(getAchievementsConfig(t)).map(([type, config]) => {
              // Check family-wide achievements instead of user-specific
              const isUnlocked = (() => {
                switch (type) {
                  case 'first_task':
                    return familyCompletedTasks >= 1;
                  case 'team_player':
                    return familyCompletedTasks >= 10;
                  case 'family_hero':
                    return familyTotalPoints >= 100;
                  case 'organizer':
                    return familyCreatedEvents >= 5;
                  case 'helper':
                    return familyCompletedShopping >= 20;
                  case 'milestone_100':
                    return familyTotalPoints >= 100;
                  case 'milestone_500':
                    return familyTotalPoints >= 500;
                  case 'milestone_1000':
                    return familyTotalPoints >= 1000;
                  default:
                    return false;
                }
              })();
              
              return (
                <View key={type} style={[
                  styles.achievementCard,
                  isUnlocked ? styles.unlockedAchievement : styles.lockedAchievement
                ]}>
                  <View style={[
                    styles.achievementIcon,
                    isUnlocked && styles.unlockedIcon
                  ]}>
                    {type === 'first_task' && <CheckCircle size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                    {type === 'team_player' && <Users size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                    {type === 'family_hero' && <Crown size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                    {type === 'organizer' && <Calendar size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                    {type === 'helper' && <Gift size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                    {type.includes('milestone') && <Trophy size={20} color={isUnlocked ? "#54FE54" : "#CCCCCC"} strokeWidth={2} />}
                  </View>
                  
                  <Text style={[
                    styles.achievementTitle,
                    isUnlocked && styles.unlockedTitle
                  ]}>
                    {config.title}
                  </Text>
                  
                  <Text style={styles.achievementDescription}>
                    {config.description}
                  </Text>
                  
                  {isUnlocked && (
                    <View style={styles.achievementUnlocked}>
                      <CheckCircle size={14} color="#54FE54" strokeWidth={2} />
                      <Text style={styles.achievementUnlockedText}>{t('flames.achievements.unlocked')}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </AnimatedView>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('flames.goal.title')}</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowGoalModal(false)}
              >
                <X size={20} color="#666666" strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('flames.goal.name')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('flames.goal.name.placeholder')}
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  placeholderTextColor="#888888"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('flames.goal.points')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('flames.goal.points.placeholder')}
                  value={newGoalTarget}
                  onChangeText={setNewGoalTarget}
                  placeholderTextColor="#888888"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('flames.goal.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.createButton, !newGoalTitle.trim() && styles.createButtonDisabled]}
                onPress={handleCreateGoal}
                disabled={!newGoalTitle.trim()}
              >
                <Text style={[styles.createButtonText, !newGoalTitle.trim() && styles.createButtonTextDisabled]}>
                  {t('flames.goal.create')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
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
  loadingFlame: {
    width: 80,
    height: 80,
    borderRadius: 40,
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

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // User Stats Card
  userStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#54FE54',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#54FE54',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    opacity: 0.6,
  },
  selectedPeriodButtonText: {
    opacity: 1,
  },
  userStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  levelIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#54FE54',
    borderStyle: 'dashed',
  },
  userStatsInfo: {
    flex: 1,
  },
  userStatsName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  userStatsRank: {
    fontSize: 14,
    color: '#161618',
    fontFamily: 'Montserrat-Regular',
  },
  userStatsPoints: {
    alignItems: 'center',
  },
  userStatsPointsNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  userStatsPointsLabel: {
    fontSize: 12,
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
  },

  // Family Level Card
  familyLevelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#54FE54',
    borderStyle: 'dashed',
  },
  familyLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  familyLevelIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#54FE54',
    borderStyle: 'dashed',
  },
  familyLevelTextContainer: {
    flex: 1,
  },
  familyLevelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  familyLevelCurrentText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  familyLevelBadge: {
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  familyLevelBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  familyLevelDescription: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 22,
  },
  
  // Progress Section
  familyLevelProgressSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    marginBottom: 20,
  },
  familyProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  familyProgressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  familyProgressPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#54FE54',
    fontFamily: 'Montserrat-Bold',
  },
  familyProgressBarContainer: {
    gap: 12,
  },
  familyProgressBar: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  familyProgressFill: {
    height: '100%',
    backgroundColor: '#54FE54',
    borderRadius: 6,
  },
  familyProgressText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  maxLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  maxLevelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#54FE54',
  },
  maxLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  
  // Next Level Preview
  nextLevelPreview: {
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    borderStyle: 'dashed',
  },
  nextLevelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  nextLevelInfo: {
    gap: 4,
  },
  nextLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  nextLevelDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },


  // Leaderboard
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  currentUserItem: {
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Montserrat-SemiBold',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  currentUserAvatar: {
    borderWidth: 3,
    borderColor: '#54FE54',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  currentUserBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  currentUserName: {
    color: '#54FE54',
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  pointsDiff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pointsDiffText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  memberPointsContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  pointsNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  currentUserPoints: {
    color: '#54FE54',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  trendIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // Activities
  activitiesContainer: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  activityUser: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  activityPoints: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityPointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  emptyActivities: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyActivitiesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  emptyActivitiesSubtext: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
  },
  unlockedAchievement: {
    borderColor: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  lockedAchievement: {
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  unlockedIcon: {
    borderColor: '#54FE54',
    backgroundColor: 'rgba(84, 254, 84, 0.15)',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  unlockedTitle: {
    color: '#54FE54',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  achievementUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  achievementUnlockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  goalModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
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
  modalForm: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  formInput: {
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#161618',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666666',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#54FE54',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#161618',
  },
  createButtonTextDisabled: {
    color: '#999999',
  },
});