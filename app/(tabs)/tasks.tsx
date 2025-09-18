import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { useSharedValue, withSpring, withDelay, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Plus, CircleCheck as CheckCircle, Circle, Trophy, Star, User, Filter, Trash2, Calendar } from 'lucide-react-native';

import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamilyTasks } from '@/hooks/useFamilyTasks';
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem';
import EmptyState from '@/components/EmptyState';
import FamilyPrompt from '@/components/FamilyPrompt';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Tasks() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'household' | 'personal' | 'work' | 'family'>('all');
  
  const { isInFamily, currentFamily, familyMembers, loading: familyLoading } = useFamily();
  const { t } = useLanguage();
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError,
    createTask, 
    toggleTaskCompletion, 
    deleteTask,
    refreshTasks,
    getCompletedTasks,
    getPendingTasks 
  } = useFamilyTasks();
  const { notifications, dismissNotification, showPointsEarned, showMemberActivity } = useNotifications();
  
  const headerOpacity = useSharedValue(0);
  const leaderboardTranslateX = useSharedValue(-50);
  const addTaskScale = useSharedValue(0.9);
  const tasksListOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (!isLoaded) {
      headerOpacity.value = withTiming(1, { duration: 600 });
      leaderboardTranslateX.value = withDelay(300, withSpring(0, { damping: 20 }));
      addTaskScale.value = withDelay(500, withSpring(1, { damping: 15 }));
      tasksListOpacity.value = withDelay(700, withTiming(1, { duration: 800 }));
      setIsLoaded(true);
    }
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const leaderboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leaderboardTranslateX.value }],
  }));

  const addTaskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addTaskScale.value }],
  }));

  const tasksListAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tasksListOpacity.value,
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
  if (familyLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('tasks.loading') || 'Loading tasks...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t('tasks.error.loading')}</Text>
          <Text style={styles.errorText}>{tasksError}</Text>
          <Pressable style={styles.retryButton} onPress={refreshTasks}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshTasks();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) {
      Alert.alert(t('common.error') || 'Error', t('tasks.error.empty') || 'Task cannot be empty');
      return;
    }

    try {
      await createTask({
        title: newTask.trim(),
        category: selectedCategory === 'all' ? 'household' : selectedCategory,
        completed: false,
        points: 15, // Fixed points for tasks
      });
      setNewTask('');
    } catch (error: any) {
      Alert.alert(t('common.error'), t('tasks.error.create') + ' ' + error.message);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const wasCompleted = task?.completed || false;
      
      await toggleTaskCompletion(taskId);
      
      // Show notification when task is completed
      if (!wasCompleted && task) {
        showPointsEarned(15, t('tasks.notifications.completed', { task: task.title }));
        
        // Show member activity notification for other family members
        showMemberActivity(
          task.assignee_profile?.name || t('tasks.list.unknown'),
          t('tasks.notifications.memberCompleted', { task: task.title })
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), t('tasks.error.toggle') + ' ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      t('tasks.delete.title'),
      t('tasks.delete.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
            } catch (error: any) {
              Alert.alert(t('common.error'), t('tasks.error.delete') + ' ' + error.message);
            }
          },
        },
      ]
    );
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const completedTasks = getCompletedTasks();
  const pendingTasks = getPendingTasks();
  const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);

  // Calculate leaderboard from family members
  const leaderboard = familyMembers.map(member => {
    const memberTasks = completedTasks.filter(task => task.assignee_id === member.user_id);
    const points = memberTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    return {
      name: member.profiles?.name || 'Unbekannt',
      points: points,
      avatar: member.profiles?.name?.charAt(0).toUpperCase() || 'U',
    };
  }).sort((a, b) => b.points - a.points);

  // Show empty state if no tasks
  if (isLoaded && tasks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={<CheckCircle size={40} color="#54FE54" strokeWidth={1.5} />}
          title={t('tasks.empty.title')}
          description={t('tasks.empty.description')}
          buttonText={t('tasks.empty.button')}
          onButtonPress={() => {
            // Focus on the input field
          }}
        />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>{t('tasks.title') || 'Tasks'}</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statText}>{completedTasks.length} {t('tasks.stats.completed')}</Text>
            <Text style={styles.pointsText}>{totalPoints} {t('tasks.stats.pointsCollected')}</Text>
          </View>
        </AnimatedView>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <AnimatedView style={[styles.section, leaderboardAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#161618" strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>{t('tasks.leaderboard.title')}</Text>
            </View>
            <AnimatedView style={styles.glassCard}>
              {leaderboard.map((member, index) => (
                <View key={member.name} style={styles.leaderboardItem}>
                  <View style={styles.leaderboardRank}>
                    {index === 0 && <Star size={16} color="#54FE54" strokeWidth={1.5} />}
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={[styles.memberAvatar, index === 1 && styles.dadAvatar, index === 2 && styles.kidAvatar]}>
                    <Text style={styles.avatarText}>{member.avatar}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberPoints}>{member.points} pts</Text>
                </View>
              ))}
            </AnimatedView>
          </AnimatedView>
        )}

        {/* Add New Task */}
        <AnimatedView style={[styles.section, addTaskAnimatedStyle]}>
          <Text style={styles.sectionTitle}>{t('tasks.add.title')}</Text>
          <View style={styles.addTaskContainer}>
            <TextInput
              style={styles.taskInput}
              placeholder={t('tasks.add.placeholder') || 'Add a new task...'}
              value={newTask}
              onChangeText={setNewTask}
              placeholderTextColor="#888888"
            />
            <AnimatedPressable 
              style={[styles.addTaskButton, newTask.trim() ? styles.addTaskButtonActive : null]}
              onPress={handleAddTask}
              disabled={!newTask.trim()}
            >
              <Plus size={20} color={newTask.trim() ? "#161618" : "#666666"} strokeWidth={1.5} />
            </AnimatedPressable>
          </View>
        </AnimatedView>

        {/* Filter Buttons */}
        <AnimatedView style={[styles.section, addTaskAnimatedStyle]}>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['all', 'household', 'personal', 'work', 'family'].map((category) => (
                <AnimatedPressable
                  key={category}
                  style={[
                    styles.filterButton,
                    selectedCategory === category && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedCategory === category && styles.filterButtonTextActive
                  ]}>
                    {t(`tasks.filter.categories.${category}`)}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </AnimatedView>

        {/* Tasks List */}
        <AnimatedView style={[styles.section, tasksListAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Filter size={20} color="#161618" strokeWidth={1.5} />
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? t('tasks.filter.all') : t(`tasks.filter.categories.${selectedCategory}`)}
            </Text>
          </View>
          
          {/* Pending Tasks */}
          <View style={styles.tasksList}>
            <Text style={styles.subsectionTitle}>{t('tasks.list.pending')} ({pendingTasks.filter(task => selectedCategory === 'all' || task.category === selectedCategory).length})</Text>
            {filteredTasks.filter(task => !task.completed).map((task) => (
              <AnimatedView key={task.id} style={styles.glassTaskCard}>
                <AnimatedPressable 
                  style={styles.taskCheckbox}
                  onPress={() => handleToggleTask(task.id)}
                  disabled={task.completed}
                >
                  {task.completed ? (
                    <CheckCircle size={20} color="#54FE54" strokeWidth={1.5} />
                  ) : (
                    <Circle size={20} color="#161618" strokeWidth={1.5} />
                  )}
                </AnimatedPressable>
                
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                  <View style={styles.taskMeta}>
                    <View style={styles.taskAssignee}>
                      <User size={12} color="#161618" strokeWidth={1.5} />
                      <Text style={styles.assigneeText}>
                        {task.assignee_profile?.name || t('tasks.list.unassigned')}
                      </Text>
                    </View>
                    <View style={styles.taskCategory}>
                      <Text style={styles.categoryText}>
                        {t(`tasks.filter.categories.${task.category}`)}
                      </Text>
                    </View>
                    {task.due_date && (
                      <View style={styles.taskDueDate}>
                        <Calendar size={12} color="#666666" strokeWidth={1.5} />
                        <Text style={styles.dueDateText}>
                          {new Date(task.due_date).toLocaleDateString('de-DE')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.taskActions}>
                  <Text style={styles.pointsText}>{task.points} pts</Text>
                  <AnimatedPressable 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 size={16} color="#666666" strokeWidth={1.5} />
                  </AnimatedPressable>
                </View>
              </AnimatedView>
            ))}

            {/* Completed Tasks */}
            {/* Completed Tasks - Show for 24h then auto-delete */}
            {completedTasks.filter(t => selectedCategory === 'all' || t.category === selectedCategory).length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, styles.completedSubsection]}>
                  {t('tasks.list.completed')} ({completedTasks.filter(task => selectedCategory === 'all' || task.category === selectedCategory).length})
                </Text>
                <View style={styles.completedNotice}>
                  <Text style={styles.completedNoticeText}>
                    {t('tasks.list.completedNotice')}
                  </Text>
                </View>
                {filteredTasks.filter(task => task.completed).map((task) => {
                  const completedTime = new Date(task.updated_at);
                  const timeRemaining = 24 - Math.floor((Date.now() - completedTime.getTime()) / (1000 * 60 * 60));
                  
                  return (
                    <AnimatedView key={task.id} style={[styles.glassTaskCard, styles.completedTaskCard]}>
                      <View style={styles.taskCheckbox}>
                        <CheckCircle size={20} color="#54FE54" strokeWidth={1.5} />
                      </View>
                      
                      <View style={styles.taskContent}>
                        <Text style={[styles.taskTitle, styles.completedTaskTitle]}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={[styles.taskDescription, styles.completedTaskDescription]}>
                            {task.description}
                          </Text>
                        )}
                        <View style={styles.taskMeta}>
                          <View style={styles.taskAssignee}>
                            <User size={12} color="#666666" strokeWidth={1.5} />
                            <Text style={styles.assigneeText}>
                              {task.assignee_profile?.name || t('tasks.list.unassigned')}
                            </Text>
                          </View>
                          <View style={styles.taskCategory}>
                            <Text style={styles.categoryText}>
                              {t(`tasks.filter.categories.${task.category}`)}
                            </Text>
                          </View>
                          <View style={styles.timeRemaining}>
                            <Text style={styles.timeRemainingText}>
                              {t('tasks.list.timeRemaining', { hours: Math.max(0, timeRemaining).toString() })}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.taskActions}>
                        <Text style={styles.pointsText}>+{task.points} pts</Text>
                        <AnimatedPressable 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 size={16} color="#888888" strokeWidth={1.5} />
                        </AnimatedPressable>
                      </View>
                    </AnimatedView>
                  );
                })}
              </>
            )}
          </View>
        </AnimatedView>
      </ScrollView>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  addTaskHeaderButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  headerStatsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
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
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  glassCard: {
    backgroundColor: 'rgba(191, 232, 236, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 232, 236, 0.3)',
  },
  leaderboardRank: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    marginRight: 12,
    gap: 4,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dadAvatar: {
    backgroundColor: 'rgba(191, 232, 236, 0.8)',
  },
  kidAvatar: {
    backgroundColor: 'rgba(255, 192, 203, 0.8)',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Montserrat-SemiBold',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
  },
  memberPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#54FE54',
    fontFamily: 'Montserrat-SemiBold',
  },
  addTaskContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  taskInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#161618',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addTaskButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskButtonActive: {
    backgroundColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterContainer: {
    marginTop: -16,
  },
  filterScroll: {
    paddingRight: 24,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#54FE54',
    borderColor: '#54FE54',
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
  },
  filterButtonTextActive: {
    color: '#161618',
  },
  tasksList: {
    gap: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 12,
  },
  completedSubsection: {
    marginTop: 20,
  },
  glassTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedTaskCard: {
    opacity: 0.7,
    backgroundColor: 'rgba(84, 254, 84, 0.05)',
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
  },
  completedTaskDescription: {
    color: '#888888',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  taskCategory: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
  taskDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },
  taskActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
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
  completedNotice: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 254, 84, 0.2)',
  },
  completedNoticeText: {
    fontSize: 12,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  timeRemaining: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeRemainingText: {
    fontSize: 9,
    color: '#54FE54',
    fontFamily: 'Montserrat-Medium',
  },
});