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
import { useFamilyPoints } from '@/hooks/useFamilyPoints';

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


export default function FlamesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedProfile, setRefreshedProfile] = useState(null);
  
  const { isInFamily, familyMembers, loading: familyLoading, refreshFamily } = useFamily();
  const { user, profile, session } = useAuth();
  const { t } = useLanguage();
  const {
    leaderboard,
    currentUserPoints,
    loading: pointsLoading,
    error: pointsError,
    refreshData,
  } = useFamilyPoints();

  // Refresh profile data when component mounts to ensure we have the latest data
  useEffect(() => {
    const refreshProfileData = async () => {
      if (!user || !session?.access_token) {
        console.log('⚠️ Flames page: No user or session for profile refresh');
        return;
      }
      
      try {
        console.log('🔄 Flames page: Refreshing profile data via REST API...');
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
          console.log('✅ Flames page: Profile data refreshed via REST API:', profileData);
          if (profileData && profileData.length > 0) {
            setRefreshedProfile(profileData[0]);
          }
        } else {
          console.log('⚠️ Flames page: Profile refresh failed:', response.status);
        }
      } catch (error) {
        console.log('⚠️ Flames page: Profile refresh failed:', error);
      }
    };
    
    refreshProfileData();
  }, []); // Run once on mount
  

  // Show loading screen while checking family status
  if (familyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
    return 'Family Teenager';
  };

  // Mock data for the design
  const userFlames = 10001;
  const currentRank = 4;
  const familyRank = 1;
  const progressToNext = 360;
  const progressTotal = 400;


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
                <VerificationIcon size={16} />
              </View>
              <Text style={styles.userRole}>Family {getUserRole()}</Text>
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
              <Text style={styles.sectionTitle}>Current Rank</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentRank}</Text>
          </View>
              </View>
            <Text style={styles.sectionSubtitle}>See in your Rank Progress</Text>
            
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
                  <Text style={styles.goldMemberTitle}>Gold Member</Text>
                  <Text style={styles.goldMemberSubtitle}>Current Status</Text>
                  </View>
                </View>
              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <Text style={styles.progressLabel}>Progress to Platinum Member</Text>
                  <Text style={styles.progressText}>{progressToNext}/{progressTotal} Flames</Text>
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
              <Text style={styles.sectionTitle}>Family Ranks</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{familyRank}</Text>
          </View>
                  </View>
            <Text style={styles.sectionSubtitle}>You are right now on the 1st Place in the Family</Text>
            
                  <View style={styles.rankCardsContainer}>
                    <View style={styles.rankCardItem}>
                      <Text style={styles.rankCardTitle}>Place 2</Text>
                      <Text style={styles.rankCardPoints}>291000 Flames</Text>
                      <View style={styles.rankCardAvatar}>
                        <User size={20} color="#17f196" strokeWidth={2} />
                      </View>
                      <View style={styles.rankCardNameContainer}>
                        <Text style={styles.rankCardFirstName}>Tonald</Text>
                        <Text style={styles.rankCardLastName}>Drump</Text>
                  </View>
                    </View>
                    
                    <View style={styles.rankCardItem}>
                      <Text style={styles.rankCardTitle}>Place 1</Text>
                      <Text style={styles.rankCardPoints}>291000 Flames</Text>
                      <View style={styles.rankCardAvatar}>
                        <User size={20} color="#17f196" strokeWidth={2} />
                      </View>
                      <View style={styles.rankCardNameContainer}>
                        <Text style={styles.rankCardFirstName}>Tonald</Text>
                        <Text style={styles.rankCardLastName}>Drump</Text>
                      </View>
                  </View>

                    <View style={styles.rankCardItem}>
                      <Text style={styles.rankCardTitle}>Place 3</Text>
                      <Text style={styles.rankCardPoints}>191000 Flames</Text>
                      <View style={styles.rankCardAvatar}>
                        <User size={20} color="#17f196" strokeWidth={2} />
                      </View>
                      <View style={styles.rankCardNameContainer}>
                        <Text style={styles.rankCardFirstName}>Tonald</Text>
                        <Text style={styles.rankCardLastName}>Drump</Text>
                  </View>
                </View>
                  </View>
          </View>
        </View>

        {/* Your Current Status Banner */}
        <View style={styles.section}>
          <View style={styles.workSummaryBanner}>
            <View style={styles.workSummaryContent}>
              <View style={styles.workSummaryText}>
                <Text style={styles.workSummaryTitle}>Your Current Status</Text>
                <Text style={styles.workSummarySubtitle}>Learn everything about the Flames</Text>
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
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
          </View>
            </View>
            <Text style={styles.sectionSubtitle}>Here are your current achievements</Text>
          
          <View style={styles.achievementsGrid}>
                    {/* Finished Achievements */}
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>Finished</Text>
                        <Text style={styles.achievementFlames}>+150 Flames</Text>
                  </View>
                      <View style={styles.achievementIconFinished}>
                        <Image
                          source={require('@/assets/images/icon/finished.png')}
                          style={styles.finishedIcon}
                          resizeMode="contain"
                        />
                    </View>
                      <Text style={styles.achievementName}>Tasks</Text>
                      <Text style={styles.achievementDescription}>Complete a total of 15 tasks.</Text>
                </View>
                    
                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>Finished</Text>
                        <Text style={styles.achievementFlames}>+100 Flames</Text>
            </View>
                      <View style={styles.achievementIconFinished}>
                        <Image
                          source={require('@/assets/images/icon/finished.png')}
                          style={styles.finishedIcon}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.achievementName}>Member</Text>
                      <Text style={styles.achievementDescription}>Invite a Member in you Family.</Text>
              </View>

                    <View style={styles.achievementCard}>
                      <View style={styles.achievementRewardContainer}>
                        <Text style={styles.achievementStatus}>Finished</Text>
                        <Text style={styles.achievementFlames}>+250 Flames</Text>
                      </View>
                      <View style={styles.achievementIconFinished}>
                        <Image
                          source={require('@/assets/images/icon/finished.png')}
                          style={styles.finishedIcon}
                          resizeMode="contain"
                />
              </View>
                      <Text style={styles.achievementName}>Calander</Text>
                      <Text style={styles.achievementDescription}>Create total of 25 events.</Text>
            </View>

                    {/* Progress Achievements */}
                    {Array.from({ length: 5 }, (_, index) => (
                      <View key={index} style={styles.achievementCard}>
                        <View style={styles.achievementRewardContainer}>
                          <Text style={styles.achievementStatus}>Progress</Text>
                          <Text style={styles.achievementFlames}>+250 Flames</Text>
            </View>
                        <View style={styles.achievementIconProgress}>
                          <Image
                            source={require('@/assets/images/icon/clock.png')}
                            style={styles.clockIcon}
                            resizeMode="contain"
                          />
          </View>
                        <Text style={styles.achievementName}>Calander</Text>
                        <Text style={styles.achievementDescription}>Create total of 25 events.</Text>
        </View>
                    ))}
                  </View>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
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

  // Section Styling
  section: {
    paddingHorizontal: 10,
  },
  futuresElementsPanel: {
    backgroundColor: '#FFFFFF',
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
    fontWeight: '400',
    color: '#17f196',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#466759',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 6,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    padding: 16,
    borderColor: '#EAECF0',
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
    color: '#2b2b2b',
    // marginBottom: 2,
  },
  goldMemberSubtitle: {
    fontSize: 10,
    fontWeight: '300',
    color: '#2b2b2b',
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
    color: '#2b2b2b',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
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
    color: '#666666',
  },

  // Rank Cards
  rankCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rankCardItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderColor: '#eaecf0',
    borderWidth: 1,
    elevation: 2,
  },
  rankCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  rankCardPoints: {
    fontSize: 5,
    fontWeight: '400',
    color: '#466759',
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
    color: '#2D2D2D',
    letterSpacing: -0.5,
  },
  rankCardLastName: {
    fontSize: 8,
    fontWeight: '400',
    color: '#466759',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaecf0',
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
    color: '#2d2d2d',
  },
  achievementFlames: {
    fontSize: 7,
    fontWeight: '400',
    color: '#466759',
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
    backgroundColor: '#E0E0E0',
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
    color: '#2d2d2d',
    // marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 7,
    fontWeight: '400',
    maxWidth: 55,
    color: '#466759',
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
    backgroundColor: '#f1f3f8',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});