import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  SafeAreaView,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
  TrendingUp
} from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { useFamilyShoppingItems } from '@/hooks/useFamilyShoppingItems';
import { useFamilyCalendarEvents } from '@/hooks/useFamilyCalendarEvents';
import { useFamilyPoints } from '@/hooks/useFamilyPoints';
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import FamilyPrompt from '@/components/FamilyPrompt';
import { router } from 'expo-router';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeDashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const { user, profile } = useAuth();
  const { isInFamily, loading: familyLoading, currentFamily, familyMembers, refreshFamily } = useFamily();
  const { t, currentLanguage, loading: languageLoading } = useLanguage();
  
  // Debug language loading
  React.useEffect(() => {
    console.log('Dashboard - Language loading:', languageLoading);
    console.log('Dashboard - Current language:', currentLanguage);
    console.log('Dashboard - Translation test:', t('dashboard.welcome'));
    
    // Test if translation is working
    const testTranslation = t('dashboard.welcome');
    if (testTranslation === 'dashboard.welcome') {
      console.warn('Translation not working - showing key instead of translation');
    } else {
      console.log('Translation working correctly:', testTranslation);
    }
  }, [languageLoading, currentLanguage, t]);
  
  const { tasks, getCompletedTasks, getPendingTasks, refreshTasks } = useFamilyTasks();
  const { items, getCompletedItems: getCompletedShoppingItems, refreshItems } = useFamilyShoppingItems();
  const { events, getUpcomingEvents, refreshEvents } = useFamilyCalendarEvents();
  const { currentUserPoints, recentActivities } = useFamilyPoints();
  const { notifications, dismissNotification, showPointsEarned } = useNotifications();
  
  // Notification Center Hook
  const {
    notifications: centerNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotificationCenter();
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const welcomeScale = useSharedValue(0.9);
  const familyCardScale = useSharedValue(0.8);
  const quickAccessOpacity = useSharedValue(0);
  const tasksTranslateY = useSharedValue(30);

  useEffect(() => {
    if ((!isLoaded && !familyLoading)) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      welcomeScale.value = withDelay(200, withSpring(1, { damping: 18 }));
      familyCardScale.value = withDelay(400, withSpring(1, { damping: 15 }));
      quickAccessOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      tasksTranslateY.value = withDelay(800, withSpring(0, { damping: 20 }));
      setIsLoaded(true);
    }
  }, [ ]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshFamily(),
        refreshTasks(),
        refreshItems(),
        refreshEvents(),
        refreshNotifications(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const welcomeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: welcomeScale.value }],
  }));

  const familyCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: familyCardScale.value }],
  }));

  const quickAccessAnimatedStyle = useAnimatedStyle(() => ({
    opacity: quickAccessOpacity.value,
  }));

  const tasksAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tasksTranslateY.value }],
    opacity: tasksTranslateY.value === 0 ? 1 : 0.7,
  }));

  // Show family prompt if user is not in a family
  if (!familyLoading && !isInFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <FamilyPrompt />
      </SafeAreaView>
    );
  }

  // Show loading while family data is being fetched
  if (familyLoading || languageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('dashboard.loading') || 'Loading dashboard...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate real stats from actual data
  const completedTasks = getCompletedTasks();
  const pendingTasks = getPendingTasks();
  const completedShoppingItems = getCompletedShoppingItems();
  const upcomingEvents = getUpcomingEvents(7); // Next 7 days
  
  // Calculate family organization percentage
  const totalItems = tasks.length + items.length + events.length;
  const completedItems = completedTasks.length + completedShoppingItems.length;
  const familyOrganizationPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate user points (15 points per completed task + 5 per shopping item)
  const userPoints = (completedTasks.length * 15) + (completedShoppingItems.length * 5);
  
  // Use real points from the points system
  const displayPoints = currentUserPoints > 0 ? currentUserPoints : userPoints;

  // Extract first name for greeting
  const userName = (() => {
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return 'Familie';
  })();

  // Get next upcoming event
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const nextEventText = nextEvent 
    ? `${nextEvent.title} (${new Date(nextEvent.event_date).toLocaleDateString('de-DE')})`
    : t('dashboard.noUpcoming');

  // Quick access modules
  const quickAccessModules = [
    {
      id: 'shopping',
      title: t('dashboard.shopping') || 'Shopping list',
      icon: <ShoppingCart size={24} color="#54FE54" strokeWidth={2} />,
      subtitle: `${items.filter(i => !i.completed).length} ${t('dashboard.items') || 'items'}`,
      onPress: () => router.push('/(tabs)/shopping'),
      available: true,
    },
    {
      id: 'calendar',
      title: t('dashboard.calendar') || 'Calendar',
      icon: <Calendar size={24} color="#54FE54" strokeWidth={2} />,
      subtitle: `${upcomingEvents.length} ${t('dashboard.appointments') || 'appointments'}`,
      onPress: () => router.push('/(tabs)/calendar'),
      available: true,
    },
    {
      id: 'tasks',
      title: t('dashboard.tasks') || 'Tasks',
      icon: <CheckSquare size={24} color="#54FE54" strokeWidth={2} />,
      subtitle: pendingTasks.length > 0 ? `${pendingTasks.length} ${t('dashboard.open') || 'open'}` : t('dashboard.allDone') || 'All done',
      onPress: () => router.push('/(tabs)/tasks'),
      available: true,
    },
    {
      id: 'flames',
      title: t('dashboard.flames') || 'Flames',
      icon: <Flame size={24} color="#54FE54" strokeWidth={2} />,
      subtitle: `${displayPoints} ${t('dashboard.points') || 'points'}`,
      onPress: () => router.push('/(tabs)/flames'),
      available: true,
    },
  ];


  const [showAddItemModal, setShowAddItemModal] = useState(false);

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
        {/* Header Bereich */}
        <AnimatedView style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            {/* Profile Picture - Top Left */}
            <View style={styles.profilePictureContainer}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Flame Icon - Top Right */}
            <View style={styles.headerActions}>
              <View style={styles.pointsContainer}>
                <Flame size={18} color="#54FE54" strokeWidth={2} />
                <Text style={styles.pointsText}>{displayPoints}</Text>
              </View>
              
              <Pressable 
                style={styles.notificationButton}
                onPress={() => setShowNotificationCenter(true)}
              >
                <Bell size={20} color="#161618" strokeWidth={2} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          
          {/* Text Content Below Profile Picture */}
          <View style={styles.textContent}>
            <Text style={styles.text1}>
              {currentLanguage.code === 'en' ? 'Welcome back to your family' : 
               currentLanguage.code === 'de' ? 'Willkommen zurück in deiner Familie' : 
               currentLanguage.code === 'nl' ? 'Welkom terug bij je familie' : 
               currentLanguage.code === 'fr' ? 'Bienvenue dans votre famille' : 
               currentLanguage.code === 'es' ? 'Bienvenido de vuelta a tu familia' : 
               currentLanguage.code === 'it' ? 'Bentornato nella tua famiglia' : 
               t('dashboard.welcome') || 'Welcome back to your family'}
            </Text>
            <Text style={styles.text2}>
              {currentLanguage.code === 'en' ? 'Welcome back to your family' : 
               currentLanguage.code === 'de' ? 'Willkommen zurück in deiner Familie' : 
               currentLanguage.code === 'nl' ? 'Welkom terug bij je familie' : 
               currentLanguage.code === 'fr' ? 'Bienvenue dans votre famille' : 
               currentLanguage.code === 'es' ? 'Bienvenido de vuelta a tu familia' : 
               currentLanguage.code === 'it' ? 'Bentornato nella tua famiglia' : 
               t('dashboard.welcome') || 'Welcome back to your family'}
            </Text>
          </View>
        </AnimatedView>

        {/* Familie Summary Card (Option A) */}
        <AnimatedView style={[styles.section, familyCardAnimatedStyle]}>
          <View style={styles.familySummaryCard}>
            <View style={styles.familySummaryHeader}>
              <View style={styles.familyIconContainer}>
                <Users size={24} color="#54FE54" strokeWidth={2} />
              </View>
              <View style={styles.familySummaryInfo}>
                <Text style={styles.familySummaryName}>{currentFamily?.name || 'Meine Familie'}</Text>
                <View style={styles.familySummaryMeta}>
                  <Text style={styles.familySummaryMembers}>{familyMembers.length} Mitglieder</Text>
                  <View style={styles.familySummaryDivider} />
                  <Text style={styles.familySummaryOnline}>
                    {Math.floor(familyMembers.length * 0.6)} online
                  </Text>
                </View>
              </View>
              <View style={styles.familyProgressContainer}>
                <View style={styles.familyProgressCircle}>
                  <Text style={styles.familyProgressText}>{familyOrganizationPercentage}%</Text>
                </View>
              </View>
            </View>
            
            {/* Familie CTA Button */}
            <Pressable 
              style={styles.familyCtaButton}
              onPress={() => router.push('/(tabs)/family')}
            >
              <Text style={styles.familyCtaText}>{t('dashboard.family.manage')}</Text>
              <ArrowRight size={16} color="#161618" strokeWidth={2} />
            </Pressable>
          </View>
        </AnimatedView>

        {/* Schnellzugriff-Module (2x2 Grid) */}
        <AnimatedView style={[styles.section, quickAccessAnimatedStyle]}>
          <Text style={styles.sectionTitle}>
            {currentLanguage.code === 'en' ? 'Quick access' : 
             currentLanguage.code === 'de' ? 'Schnellzugriff' : 
             currentLanguage.code === 'nl' ? 'Snelle toegang' : 
             currentLanguage.code === 'fr' ? 'Accès rapide' : 
             currentLanguage.code === 'es' ? 'Acceso rápido' : 
             currentLanguage.code === 'it' ? 'Accesso rapido' : 
             t('dashboard.quickAccess') || 'Quick access'}
          </Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessModules.map((module) => (
              <Pressable
                key={module.id}
                style={[
                  styles.quickAccessCard,
                  !module.available && styles.quickAccessCardDisabled
                ]}
                onPress={module.onPress}
                disabled={!module.available}
              >
                <View style={[
                  styles.quickAccessIcon,
                  !module.available && styles.quickAccessIconDisabled
                ]}>
                  {module.icon}
                </View>
                <Text style={[
                  styles.quickAccessTitle,
                  !module.available && styles.quickAccessTitleDisabled
                ]}>
                  {module.title}
                </Text>
                <Text style={[
                  styles.quickAccessSubtitle,
                  !module.available && styles.quickAccessSubtitleDisabled
                ]}>
                  {module.subtitle}
                </Text>
                
              </Pressable>
            ))}
          </View>
        </AnimatedView>

        {/* Aktuelle Aufgaben/Nächste Schritte */}
        <AnimatedView style={[styles.section, tasksAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.nextSteps') || 'Next steps'}</Text>
            <Pressable 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <Text style={styles.seeAllText}>{t('dashboard.showAll') || 'Show all'}</Text>
              <ChevronRight size={16} color="#666666" strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.tasksList}>
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 3).map((task, index) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskCardHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskCategory}>
                      <Text style={styles.taskCategoryText}>
                        {task.category === 'household' ? 'Haushalt' :
                         task.category === 'personal' ? 'Persönlich' :
                         task.category === 'work' ? 'Arbeit' :
                         task.category === 'family' ? 'Familie' :
                         task.category}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Fortschrittsbalken */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View style={[
                        styles.progressBarFill, 
                        { width: `${task.completed ? 100 : (task.assignee_id ? 50 : 0)}%` }
                      ]} />
                    </View>
                    <Text style={styles.progressPercentageText}>
                      {task.completed ? '100' : (task.assignee_id ? '50' : '0')}%
                    </Text>
                  </View>
                  
                  <View style={styles.taskFooter}>
                    <Text style={styles.taskAssignee}>
                      {task.assignee_profile?.name ? `Zugewiesen an ${task.assignee_profile.name}` : 'Nicht zugewiesen'}
                    </Text>
                    <Text style={styles.taskPoints}>{task.points} {t('dashboard.points')}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyTasksCard}>
                <CheckSquare size={32} color="#54FE54" strokeWidth={1.5} />
                <Text style={styles.emptyTasksTitle}>{t('dashboard.allTasksDone')}</Text>
                <Text style={styles.emptyTasksSubtitle}>
                  {t('dashboard.greatJob')}
                </Text>
              </View>
            )}
          </View>
        </AnimatedView>

        {/* {t('tabs.dashboard.todayOverview')} */}
        <AnimatedView style={[styles.section, tasksAnimatedStyle]}>
          <Text style={styles.sectionTitle}>{t('dashboard.todayOverview')}</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <TrendingUp size={18} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.overviewStatText}>
                  <Text style={styles.overviewStatNumber}>{familyOrganizationPercentage}%</Text>
                  <Text style={styles.overviewStatLabel}>{t('dashboard.progress')}</Text>
                </View>
              </View>
              
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <CheckSquare size={18} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.overviewStatText}>
                  <Text style={styles.overviewStatNumber}>{completedTasks.length}</Text>
                  <Text style={styles.overviewStatLabel}>{t('dashboard.completedToday')}</Text>
                </View>
              </View>
              
              <View style={styles.overviewStatItem}>
                <View style={styles.overviewStatIcon}>
                  <Calendar size={18} color="#54FE54" strokeWidth={2} />
                </View>
                <View style={styles.overviewStatText}>
                  <Text style={styles.overviewStatNumber}>{upcomingEvents.length}</Text>
                  <Text style={styles.overviewStatLabel}>{t('dashboard.thisWeek')}</Text>
                </View>
              </View>
            </View>

            {/* Next Event Preview */}
            {nextEvent && (
              <View style={styles.nextEventSection}>
                <View style={styles.nextEventHeader}>
                  <Calendar size={16} color="#666666" strokeWidth={2} />
                  <Text style={styles.nextEventLabel}>{t('dashboard.nextAppointment')}</Text>
                </View>
                <Text style={styles.nextEventText}>{nextEventText}</Text>
              </View>
            )}
          </View>
        </AnimatedView>

        {/* Bottom spacing für Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Notification Center Modal */}
      <NotificationCenter
        visible={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        notifications={centerNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // === HEADER BEREICH ===
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profilePictureContainer: {
    // Top-left positioning - no additional margin needed
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  
  // Text content positioned below profile picture
  textContent: {
    paddingLeft: 10,
  },
  text1: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  text2: {
    fontSize: 14,
    color: '#A3A9A2',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
  
  // Header actions positioned top-right
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  notificationButton: {
    position: 'relative',
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
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },

  // === SECTIONS ===
  section: {
    paddingHorizontal: 24,
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
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },

  // === BIRTHDAY CARD ===

  // === FAMILIENÜBERSICHT CARD ===
  familySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  familySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  familyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  familySummaryInfo: {
    flex: 1,
  },
  familySummaryName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  familySummaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  familySummaryMembers: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  familySummaryDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#54FE54',
  },
  familySummaryOnline: {
    fontSize: 13,
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  familyProgressContainer: {
    alignItems: 'center',
  },
  familyProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyProgressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  familyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
    gap: 6,
  },
  familyCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },

  // === SCHNELLZUGRIFF GRID ===
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickAccessCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  quickAccessCardDisabled: {
    opacity: 0.6,
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickAccessIconDisabled: {
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickAccessTitleDisabled: {
    color: '#999999',
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  quickAccessSubtitleDisabled: {
    color: '#BBBBBB',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999999',
    fontFamily: 'Montserrat-SemiBold',
  },
  quickActionButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },

  // === TASKS LISTE ===
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    flex: 1,
    marginRight: 12,
  },
  taskCategory: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#54FE54',
    borderRadius: 4,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
    minWidth: 30,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssignee: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  taskPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  emptyTasksCard: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  emptyTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTasksSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  // === HEUTE IM ÜBERBLICK ===
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  overviewStatItem: {
    alignItems: 'center',
    gap: 8,
  },
  overviewStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewStatText: {
    alignItems: 'center',
  },
  overviewStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  overviewStatLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  nextEventSection: {
    paddingTop: 16,
  },
  nextEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nextEventLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  nextEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },

  // === BOTTOM SPACING ===
  bottomSpacing: {
    height: 100,
  },
});