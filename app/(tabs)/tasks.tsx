import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyTasks, FamilyTask } from '@/hooks/useFamilyTasks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { router } from 'expo-router';
import { getTheme } from '@/constants/theme';
import TaskEditModal from '@/components/TaskEditModal';
import { 
  FadeInAnimation, 
  SlideInAnimation, 
  BounceInAnimation 
} from '@/components/CoolAnimations';

export default function Tasks() {
  const { user, profile } = useAuth();
  const { tasks, loading: tasksLoading, refreshTasks } = useFamilyTasks();
  const { t } = useLanguage();
  const { isDarkMode } = useDarkMode();
  const theme = getTheme(isDarkMode);
  const [selectedFilter, setSelectedFilter] = useState<'inProgress' | 'finish'>('inProgress');
  const [selectedTask, setSelectedTask] = useState<FamilyTask | null>(null);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);

  // Listen for refresh events from notifications
  useEffect(() => {
    const handleRefreshTasks = () => {
      console.log('🔄 Tasks refresh triggered from notification');
      if (refreshTasks) {
        refreshTasks();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('refreshTasks', handleRefreshTasks);
      
      return () => {
        window.removeEventListener('refreshTasks', handleRefreshTasks);
      };
    }
  }, [refreshTasks]);

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
    return 'TD';
  };

  // Test with some sample data if no tasks are loaded
  const testTasks: any[] = [];

  // Use test tasks if no real tasks are loaded
  const tasksToUse = tasks && tasks.length > 0 ? tasks : testTasks;
  console.log('🔍 Using tasks:', tasksToUse);

  // Calculate task counts based on date criteria (matching the filtering logic)
  const getTaskCounts = () => {
    if (!tasksToUse || tasksToUse.length === 0) {
      return { todo: 0, inProgress: 0, done: 0 };
    }

    const currentDate = new Date();
    const todayString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Parse dates consistently - same logic as getFilteredTasks
    const parseDateString = (dateValue: any): string => {
      if (!dateValue) return '';
      // If it's already a date string in YYYY-MM-DD format, use it directly
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      // Otherwise, parse as Date and extract date part
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    let todo = 0;
    let inProgress = 0;
    let done = 0;

    tasksToUse.forEach((task) => {
      // Skip tasks without dates (same as filtering logic)
      if (!task.start_date || !task.end_date) {
        return;
      }

      const startDate = parseDateString(task.start_date);
      const endDate = parseDateString(task.end_date);

      // Skip if dates couldn't be parsed
      if (!startDate || !endDate) {
        return;
      }

      // In Progress: start_date < current date && end_date > current date
      if (startDate < todayString && endDate > todayString) {
        inProgress++;
      }
      // Finish: end_date < current date (tasks past their end date)
      else if (endDate < todayString) {
        done++;
      }
      // ToDo: start_date > current Date (future tasks)
      else if (startDate > todayString) {
        todo++;
      }
    });

    return { todo, inProgress, done };
  };

  const { todo, inProgress, done } = getTaskCounts();

  // Mock data for tasks
  const mockTasks = [
    {
      id: 1,
      title: 'Wiring Dashboard Analytics',
      status: 'In Progress',
      priority: 'High',
      progress: 85,
      assignees: ['A', 'B', 'C'],
      dueDate: '27 April'
    },
    {
      id: 2,
      title: 'API Dashboard Analytics Integration',
      status: 'In Progress',
      priority: 'High',
      progress: 70,
      assignees: ['A', 'B', 'C'],
      dueDate: '27 April'
    }
  ];

  // Filter tasks based on selected filter and date criteria
  const getFilteredTasks = () => {
    if (!tasksToUse || tasksToUse.length === 0) {
      return [];
    }

    const currentDate = new Date();
    const todayString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    return tasksToUse.filter(task => {
      // If no dates, don't show in either section
      if (!task.start_date || !task.end_date) {
        return false;
      }

      // Parse dates consistently - handle both date strings and timestamps
      const parseDateString = (dateValue: any): string => {
        if (!dateValue) return '';
        // If it's already a date string in YYYY-MM-DD format, use it directly
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        // Otherwise, parse as Date and extract date part
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      const startDate = parseDateString(task.start_date);
      const endDate = parseDateString(task.end_date);

      // Skip if dates couldn't be parsed
      if (!startDate || !endDate) {
        return false;
      }

      switch (selectedFilter) {
        case 'inProgress':
          // In Progress: start_date < current date && end_date > current date
          return startDate < todayString && endDate > todayString;
        case 'finish':
          // Finish: end_date < current date (tasks past their end date)
          return endDate < todayString;
        default:
          return false;
      }
    });
  };

  const filteredTasks = getFilteredTasks();

  // Create themed styles
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.surface} 
      />
      
      {/* Header */}
      <FadeInAnimation delay={0} duration={500}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
          <View style={styles.statusBarIcons}>
            {/* Status bar icons would go here */}
          </View>
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('tasksPage.header.title')}</Text>
            <Text style={styles.subtitle}>{t('tasksPage.header.subtitle')}</Text>
          </View>
          <View style={styles.headerIllustration}>
            <Image
              source={require('@/assets/images/icon/task_header.png')}
              style={styles.illustrationImage}
            />
          </View>
        </View>
        </View>
      </FadeInAnimation>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary of Your Work */}
        <SlideInAnimation direction="up" delay={0} duration={600} intensity={50}>
          <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('tasksPage.summary.title')}</Text>
          <Text style={styles.summarySubtitle}>{t('tasksPage.summary.subtitle')}</Text>
          
          <View style={styles.progressCards}>
            <View style={{ flex: 1 }}>
              <BounceInAnimation delay={100} duration={800}>
                <View style={styles.progressCard}>
                  <View style={styles.progressCardContent}>
                    <Image
                      source={require('@/assets/images/icon/task_clock.png')}
                      style={styles.progressIconImage}
                    />
                    <Text style={styles.progressLabel}>{t('tasksPage.summary.inProgress')}</Text>
                  </View>
                  <Text style={styles.progressNumber}>{inProgress}</Text>
                </View>
              </BounceInAnimation>
            </View>
            
            <View style={{ flex: 1 }}>
              <BounceInAnimation delay={200} duration={800}>
                <View style={styles.progressCard}>
                  <View style={styles.progressCardContent}>
                    <Image
                      source={require('@/assets/images/icon/tick-circle.png')}
                      style={styles.progressIconImage}
                    />
                    <Text style={styles.progressLabel}>{t('tasksPage.summary.done')}</Text>
                  </View>
                  <Text style={styles.progressNumber}>{done}</Text>
                </View>
              </BounceInAnimation>
            </View>
          </View>
        </View>
        </SlideInAnimation>

        {/* Sprint Stats */}
        <SlideInAnimation direction="up" delay={200} duration={600} intensity={50}>
          <View style={styles.sprintCard}>
          <View style={styles.sprintHeader}>
            <View style={styles.sprintTitleContainer}>
              <Text style={styles.sprintTitle}>{t('tasksPage.sprint.title')}</Text>
              <View style={styles.statusTag1}>
                <Text style={styles.statusTagText1}>{t('tasksPage.sprint.status')}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.sprintDescription}>
            {t('tasksPage.sprint.description')}
          </Text>
          <View style={styles.burnoutIndicatorContainer}>
            <View style={styles.burnoutIndicator}>
              <Image
                source={require('@/assets/images/icon/poor.png')}
                style={styles.burnoutIcon}
                resizeMode="contain"
              />
              <View style={styles.sprintProgressBar}>
                <View style={[styles.sprintProgressFill, { width: '85%' }]} />
              </View>
            </View>
          </View>
        </View>
        </SlideInAnimation>

        {/* Filter Bar */}
        <SlideInAnimation direction="up" delay={300} duration={600} intensity={50}>
          <View style={styles.filterBarContainer}>
          <View style={styles.filterBar}>
            <Pressable 
              style={[styles.filterButton, selectedFilter === 'inProgress' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('inProgress')}
            >
              <Text style={[styles.filterText, selectedFilter === 'inProgress' && styles.filterTextActive]}>{t('tasksPage.filter.inProgress')}</Text>
              <View style={[styles.filterBadge, selectedFilter === 'inProgress' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, selectedFilter === 'inProgress' && styles.filterBadgeTextActive]}>{inProgress}</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={[styles.filterButton, selectedFilter === 'finish' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('finish')}
            >
              <Text style={[styles.filterText, selectedFilter === 'finish' && styles.filterTextActive]}>{t('tasksPage.filter.finish')}</Text>
              <View style={[styles.filterBadge, selectedFilter === 'finish' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, selectedFilter === 'finish' && styles.filterBadgeTextActive]}>{done}</Text>
              </View>
            </Pressable>
          </View>
        </View>
        </SlideInAnimation>

        {/* Task List */}
        <SlideInAnimation direction="up" delay={400} duration={600} intensity={50}>
          <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={isDarkMode 
                  ? require('@/assets/images/icon/no_task_dark.png')
                  : require('@/assets/images/icon/no_task.svg')
                }
                style={styles.emptyStateImage}
              />
              <Text style={styles.emptyStateText}>{t('tasksPage.emptyState.title')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'inProgress' 
                  ? t('tasksPage.emptyState.noInProgress') 
                  : t('tasksPage.emptyState.noCompleted')}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              // Parse dates consistently - same logic as filtering
              const parseDateString = (dateValue: any): string => {
                if (!dateValue) return '';
                if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  return dateValue;
                }
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
              };

              const currentDate = new Date();
              const todayString = currentDate.toISOString().split('T')[0];
              const startDate = parseDateString(task.start_date);
              const endDate = parseDateString(task.end_date);
              
              // Determine task status based on dates
              let taskStatus = t('tasksPage.taskStatus.toDo');
              if (startDate < todayString && endDate > todayString) {
                taskStatus = t('tasksPage.taskStatus.inProgress');
              } else if (endDate < todayString) {
                taskStatus = t('tasksPage.taskStatus.done');
              }

              // Calculate progress based on dates (matching SQL function logic)
              const calculateProgress = () => {
                if (!startDate || !endDate) return 0;
                
                // Parse dates to Date objects at midnight for calculation
                const parseDateOnly = (dateString: string): Date => {
                  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = dateString.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  }
                  const date = new Date(dateString);
                  const year = date.getFullYear();
                  const month = date.getMonth();
                  const day = date.getDate();
                  return new Date(year, month, day);
                };

                const start = parseDateOnly(startDate);
                const end = parseDateOnly(endDate);
                const now = new Date();
                const currentDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                // If current date < start date: 0%
                if (currentDateOnly < start) return 0;
                
                // If current date >= end date: 100%
                if (currentDateOnly >= end) return 100;
                
                // Calculate progress: (current_date - start_date) / (end_date - start_date) * 100
                const totalDuration = end.getTime() - start.getTime();
                const elapsedDuration = currentDateOnly.getTime() - start.getTime();
                
                if (totalDuration > 0) {
                  const calculatedProgress = (elapsedDuration / totalDuration) * 100;
                  return Math.min(100, Math.max(0, calculatedProgress));
                } else if (totalDuration === 0) {
                  // Same start and end date
                  return 100;
                } else {
                  // Invalid: end date before start date
                  return 0;
                }
              };

              const progress = calculateProgress();

              return (
                <BounceInAnimation key={task.id} delay={500 + (filteredTasks.indexOf(task) * 50)} duration={600}>
                  <Pressable 
                    style={styles.taskCard}
                    onPress={() => {
                      setSelectedTask(task);
                      setShowTaskEditModal(true);
                    }}
                  >
                  <View style={styles.taskHeader}>
                    <View style={styles.taskIcon}>
                      <Image
                        source={require('@/assets/images/icon/flash.png')}
                        style={styles.taskIconImage}
                      />
                    </View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  
                  <View style={styles.taskTags}>
                    <View style={styles.statusTag}>
                      <Image
                        source={require('@/assets/images/icon/in_progress.png')}
                        style={styles.statusTagIcon}
                      />
                      <Text style={styles.statusTagText}>{taskStatus}</Text>
                    </View>
                    {(() => {
                      const priority = (task as any).priority || task.category || 'Normal';
                      const isHighLevel = priority === 'High Level' || priority === 'high' || priority === 'household';
                      return (
                        <View style={[
                          styles.priorityTag,
                          isHighLevel ? styles.priorityTagHigh : styles.priorityTagNormal
                        ]}>
                          <Image
                            source={require('@/assets/images/icon/flag.png')}
                            style={styles.priorityIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.priorityText}>
                            {isHighLevel ? 'High Level' : 'Normal'}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.round(progress)}%` }]} />
                  </View>
                   
                   <View style={styles.taskFooter}>
                     <View style={styles.assigneeAvatars}>
                       {task.assignees && task.assignees.length > 0 ? (
                         task.assignees.slice(0, 3).map((assignee: any, index: number) => (
                           <View key={assignee.user_id || `assignee-${index}`} style={[styles.assigneeAvatar, { backgroundColor: '#17F196', marginLeft: index > 0 ? -8 : 0 }]}>
                             {assignee.avatar_url ? (
                               <Image 
                                 source={{ uri: assignee.avatar_url }} 
                                 style={styles.assigneeAvatarImage}
                                 resizeMode="cover"
                               />
                             ) : (
                               <View style={styles.assigneeAvatarPlaceholder}>
                                 <Text style={styles.assigneeAvatarInitial}>
                                   {assignee.name?.charAt(0).toUpperCase() || '?'}
                                 </Text>
                               </View>
                             )}
                           </View>
                         ))
                       ) : (
                         <View style={[styles.assigneeAvatar, { backgroundColor: '#17F196', marginLeft: 0 }]}>
                           <View style={styles.assigneeAvatarPlaceholder}>
                             <Text style={styles.assigneeAvatarInitial}>?</Text>
                           </View>
                         </View>
                       )}
                     </View>
                     <View style={styles.dueDate}>
                       <Image
                         source={require('@/assets/images/icon/calendar2_dis.png')}
                         style={styles.calendarIcon}
                       />
                       <Text style={styles.dueDateText}>
                         {task.due_date ? new Date(task.due_date).toLocaleDateString() : t('tasksPage.task.noDueDate')}
                       </Text>
                     </View>
                   </View>
                </Pressable>
                </BounceInAnimation>
              );
            })
          )}
        </View>
        </SlideInAnimation>
      </ScrollView>

      {/* Task Edit Modal */}
      <TaskEditModal
        visible={showTaskEditModal}
        onClose={() => {
          setShowTaskEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={() => {
          refreshTasks();
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: '#17f196',
    paddingTop: 40,
    minHeight: 230,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -90,
    paddingHorizontal: 20,
    // paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 20,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
  },
  statusBarIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FEFEFE',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D9D6FE',
  },
  headerIllustration: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 87,
    height: 80,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  summaryCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    lineHeight: 19.6, // 140% of 14px
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    lineHeight: 16.8, // 140% of 12px
    marginBottom: 16,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 16,
  },
  progressCard: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: theme.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  progressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressIconImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    letterSpacing: -0.5,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '400',
    color: theme.text,
    letterSpacing: -0.5,
  },
  sprintCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  sprintHeader: {
    marginBottom: 8,
  },
  sprintTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sprintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    lineHeight: 19.6, // 140% of 14px
  },
  statusTag1: {
    backgroundColor: '#FD824C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusTagText1: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sprintDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    lineHeight: 16.8, // 140% of 12px
    marginBottom: 16,
  },
  burnoutIndicatorContainer: {
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  burnoutIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  burnoutIcon: {
    width: 32,
    height: 32,
  },
  sprintProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.input,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sprintProgressFill: {
    height: '100%',
    backgroundColor: '#FD824C',
    borderRadius: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.input,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#17F196',
    borderRadius: 4,
  },
  filterBarContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 4,
    alignItems: 'center',
    elevation: 2,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#17f196',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterTextActive: {
    color: '#fefefe',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: theme.input,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterBadgeTextActive: {
    color: theme.textSecondary,
  },
  taskList: {
    paddingHorizontal: 10,
    gap: 16,
  },
  taskCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
  taskIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
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
    backgroundColor: theme.input,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusTagIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  priorityTagNormal: {
    backgroundColor: '#17F196', // Green for Normal
  },
  priorityTagHigh: {
    backgroundColor: '#FF6B6B', // Red for High Level
  },
  priorityIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  assigneeAvatars: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  assigneeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  assigneeAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: theme.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textSecondary,
    lineHeight: 16.8, // 140% of 12px
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.textSecondary,
    textAlign: 'center',
  },
});