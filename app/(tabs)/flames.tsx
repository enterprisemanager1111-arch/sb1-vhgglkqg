import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import { Flame, Crown, CheckCircle, Clock, Camera, Zap, Users, User, Home } from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getTheme } from '@/constants/theme';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyCalendarEvents } from '@/hooks/useFamilyCalendarEvents';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
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

// Interface for family member ranking data
interface FamilyMemberRanking {
  user_id: string;
  name: string;
  avatar_url?: string;
  total_points: number;
  completed_tasks: number;
  completed_events: number;
  completed_shopping_items: number;
  rank_position: number;
  role: string;
  joined_at: string;
}


export default function FlamesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [familyRanking, setFamilyRanking] = useState<FamilyMemberRanking[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  
  const { isInFamily, familyMembers, loading: familyLoading, refreshFamily, currentFamily } = useFamily();
  const { user, profile, session } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  
  // Create themed styles
  const styles = createStyles(theme, isDarkMode);
  const {
    leaderboard,
    currentUserPoints,
    loading: pointsLoading,
    error: pointsError,
    refreshData,
  } = useFamilyPoints();

  // Get family data counts
  const { tasks, loading: tasksLoading } = useFamilyTasks();
  const { events, loading: eventsLoading } = useFamilyCalendarEvents();
  const { items, loading: itemsLoading } = useFamilyShoppingItems();

  // Function to fetch family member ranking
  const fetchFamilyRanking = async () => {
    if (!currentFamily?.id) return;
    
    setRankingLoading(true);
    try {
      console.log('🔄 Fetching family member ranking for family:', currentFamily.id);
      const { data, error } = await supabase.rpc('get_family_member_ranking', {
        _family_id: currentFamily.id
      });
      
      if (error) {
        console.error('❌ Error fetching family ranking:', error);
        return;
      }
      
      if (data) {
        console.log('✅ Family ranking data:', data);
        console.log('🔍 First member rank_position:', data[0]?.rank_position);
        console.log('🔍 All rank_positions:', data.map(m => m.rank_position));
        setFamilyRanking(data);
      }
    } catch (error) {
      console.error('❌ Error calling get_family_member_ranking:', error);
    } finally {
      setRankingLoading(false);
    }
  };

  // Removed redundant profile API call - using profile from AuthContext
  
  // Fetch family ranking when component mounts or family changes
  useEffect(() => {
    if (currentFamily?.id) {
      fetchFamilyRanking();
    }
  }, [currentFamily?.id]);

  // Show loading screen while checking family status
  if (familyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
        fetchFamilyRanking(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Use profile from AuthContext (centralized state)
  const currentProfile = profile;

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
    return 'Family Teenager';
  };

  // Calculate real data counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalEvents = events.length;
  const totalShoppingItems = items.length;
  const completedShoppingItems = items.filter(item => item.completed).length;

  // Get current user's actual flames from points system
  // Fallback to family ranking data if currentUserPoints is not available
  const currentUserFromRanking = familyRanking.find(member => member.user_id === user?.id);
  const userFlames = currentUserPoints || currentUserFromRanking?.total_points || 0;
  const currentRank = 4;
  // Calculate current user's rank
  const currentUserRank = familyRanking.find(member => member.user_id === user?.id)?.rank_position || 1;
  const familyRank = currentUserRank;
  const progressToNext = 360;
  const progressTotal = 400;


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
                <VerificationIcon size={16} />
              </View>
              <Text style={styles.userRole}>{t('flames.header.familyRole', { role: getUserRole() })}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.flamesContainer}>
              <Image
                source={require('@/assets/images/icon/flame_active.png')}
                style={styles.flameIcon}
              />
              <Text style={styles.flamesText}>{userFlames.toLocaleString()}</Text>
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

        {/* Current Rank Section */}
        <View style={styles.section}>
          <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('flames.currentRank.title')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentRank}</Text>
          </View>
              </View>
            <Text style={styles.sectionSubtitle}>{t('flames.currentRank.subtitle')}</Text>
            
            <View style={styles.progressCard}>
              <View style={styles.goldMemberSection}>
                <View style={styles.crownIconContainer}>
                  <Image
                    source={require('@/assets/images/icon/crown.png')}
                    style={styles.crownIcon}
                    resizeMode="contain"
                  />
              </View>
                <View style={styles.goldMemberInfo}>
                  <Text style={styles.goldMemberTitle}>{t('flames.currentRank.goldMember')}</Text>
                  <Text style={styles.goldMemberSubtitle}>{t('flames.currentRank.currentStatus')}</Text>
                  </View>
                </View>
              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <Text style={styles.progressLabel}>{t('flames.currentRank.progressToPlatinum')}</Text>
                  <Text style={styles.progressText}>{t('flames.currentRank.flamesProgress', { current: progressToNext, total: progressTotal })}</Text>
                  </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(progressToNext / progressTotal) * 100}%` }]} />
                </View>
            </View>
                </View>
          </View>
        </View>

        {/* Family Ranks Section */}
        <View style={styles.section}>
          <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('flames.familyRanks.title')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{familyRank}</Text>
          </View>
                  </View>
            <Text style={styles.sectionSubtitle}>
              {t('flames.familyRanks.currentPosition', { 
                position: familyRank === 1 ? t('flames.familyRanks.position1st') : 
                          familyRank === 2 ? t('flames.familyRanks.position2nd') : 
                          familyRank === 3 ? t('flames.familyRanks.position3rd') : 
                          t('flames.familyRanks.positionNth', { n: familyRank })
              })}
            </Text>
            
            {rankingLoading ? (
              <View style={styles.rankCardsContainer}>
                <View style={styles.rankCardItem}>
                  <Text style={styles.rankCardTitle}>{t('common.loading')}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.rankCardsContainer}>
                {familyRanking.slice(0, 3).map((member, index) => {
                  const nameParts = member.name.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  const rankPosition = member.rank_position || index + 1;
                  
                  return (
                    <View key={member.user_id} style={styles.rankCardItem}>
                      <Text style={styles.rankCardTitle}>
                        {t('flames.familyRanks.place', { position: rankPosition })}
                      </Text>
                      <Text style={styles.rankCardPoints}>
                        {t('flames.familyRanks.flames', { count: member.total_points })}
                      </Text>
                      <View style={styles.rankCardAvatar}>
                        {member.avatar_url ? (
                          <Image
                            source={{ uri: member.avatar_url }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                          />
                        ) : (
                          <User size={40} color="#17f196" strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.rankCardNameContainer}>
                        <Text style={styles.rankCardFirstName}>{firstName}</Text>
                        <Text style={styles.rankCardLastName}>{lastName}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Your Current Status Banner */}
        <View style={styles.section}>
          <View style={styles.workSummaryBanner}>
            <View style={styles.workSummaryContent}>
              <View style={styles.workSummaryText}>
                <Text style={styles.workSummaryTitle}>{t('flames.statusBanner.title')}</Text>
                <Text style={styles.workSummarySubtitle}>{t('flames.statusBanner.subtitle')}</Text>
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

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.futuresElementsPanel}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('flames.achievements.title')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalTasks + totalEvents + totalShoppingItems}</Text>
          </View>
            </View>
            <Text style={styles.sectionSubtitle}>{t('flames.achievements.subtitle')}</Text>
          
          <View style={styles.achievementsGrid}>
                    {/* Tasks Achievement */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{completedTasks >= 15 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 150 })}</Text>
                  </View>
                      <View style={completedTasks >= 15 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {completedTasks >= 15 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
                    </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.tasks')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.tasksCompleted', { completed: completedTasks, total: 15 })}</Text>
                </View>
                    
                    {/* Calendar Events Achievement */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{totalEvents >= 25 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 250 })}</Text>
            </View>
                      <View style={totalEvents >= 25 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {totalEvents >= 25 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.calendar')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.calendarEvents', { completed: totalEvents, total: 25 })}</Text>
              </View>

                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{completedShoppingItems >= 20 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 200 })}</Text>
                      </View>
                      <View style={completedShoppingItems >= 20 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {completedShoppingItems >= 20 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
              </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.shopList')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.shopListItems', { completed: completedShoppingItems, total: 20 })}</Text>
            </View>

                    {/* Total Tasks Achievement */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{totalTasks >= 50 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 300 })}</Text>
                      </View>
                      <View style={totalTasks >= 50 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {totalTasks >= 50 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.allTasks')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.allTasksTotal', { completed: totalTasks, total: 50 })}</Text>
            </View>

                    {/* Total Events Achievement */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{totalEvents >= 50 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 400 })}</Text>
                      </View>
                      <View style={totalEvents >= 50 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {totalEvents >= 50 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.allEvents')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.allEventsTotal', { completed: totalEvents, total: 50 })}</Text>
            </View>

                    {/* Total Shopping Items Achievement */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>{totalShoppingItems >= 30 ? t('flames.achievements.finished') : t('flames.achievements.progress')}</Text>
                        <Text style={styles.achievementFlames}>{t('flames.achievements.flamesReward', { count: 350 })}</Text>
                      </View>
                      <View style={totalShoppingItems >= 30 ? styles.achievementIconFinished : styles.achievementIconProgress}>
                        {totalShoppingItems >= 30 ? (
                          <CheckCircle size={20} color="#17f196" strokeWidth={2} />
                        ) : (
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text style={styles.achievementName}>{t('flames.achievements.allItems')}</Text>
                      <Text style={styles.achievementDescription}>{t('flames.achievements.allItemsTotal', { completed: totalShoppingItems, total: 30 })}</Text>
            </View>
                  </View>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>, isDarkMode: boolean) => StyleSheet.create({
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

  // Section Styling
  section: {
    paddingHorizontal: 10,
  },
  futuresElementsPanel: {
    backgroundColor: theme.surface,
    marginHorizontal: 0,
    marginVertical: 12,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Progress Card
  progressCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderColor: theme.border,
    borderWidth: 1,
    elevation: 2,
  },
  goldMemberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  crownIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#17F196',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownIcon: {
    width: 20,
    height: 20,
  },
  goldMemberInfo: {
    flex: 1,
  },
  goldMemberTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    // marginBottom: 2,
  },
  goldMemberSubtitle: {
    fontSize: 10,
    fontWeight: '300',
    color: theme.text,
  },
  progressSection: {
    gap: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.input,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17f196',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '400',
    color: theme.textSecondary,
  },

  // Rank Cards
  rankCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rankCardItem: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderColor: theme.border,
    borderWidth: 1,
    elevation: 2,
  },
  rankCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  rankCardPoints: {
    fontSize: 5,
    fontWeight: '400',
    color: theme.textTertiary,
    marginBottom: 12,
  },
  rankCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9fff6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#17f196',
  },
  rankCardNameContainer: {
    alignItems: 'center',
    gap: 2,
  },
  rankCardFirstName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    letterSpacing: -0.5,
  },
  rankCardLastName: {
    fontSize: 8,
    fontWeight: '400',
    color: theme.textTertiary,
    letterSpacing: -0.5,
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

  // Achievements Grid
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementCard: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    width: '23%',
    minWidth: 80,
    gap: 4,
  },
  achievementRewardContainer: {
    alignItems: 'center',
    // flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  achievementStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.text,
  },
  achievementFlames: {
    fontSize: 7,
    fontWeight: '400',
    color: theme.textTertiary,
  },
  achievementIconFinished: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  finishedIcon: {
    width: 20,
    height: 20,
  },
  achievementIconProgress: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  clockIcon: {
    width: 18,
    height: 18,
  },
  achievementName: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.text,
    // marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 7,
    fontWeight: '400',
    maxWidth: 55,
    color: theme.textTertiary,
    textAlign: 'center',
    // lineHeight: 14,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 12,
  },
});