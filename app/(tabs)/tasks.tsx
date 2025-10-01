import React, { useState } from 'react';
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
import { router } from 'expo-router';

export default function Tasks() {
  const { user, profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'inProgress' | 'finish'>('inProgress');

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

  const filteredTasks = selectedFilter === 'all' 
    ? mockTasks 
    : selectedFilter === 'inProgress' 
    ? mockTasks.filter(task => task.status === 'In Progress')
    : mockTasks.filter(task => task.status === 'Done');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.statusBarIcons}>
            {/* Status bar icons would go here */}
          </View>
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Task Awaiting</Text>
            <Text style={styles.subtitle}>Let's tackle your to do list</Text>
          </View>
          <View style={styles.headerIllustration}>
            <Image
              source={require('@/assets/images/icon/task_header.png')}
              style={styles.illustrationImage}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary of Your Work */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary of Your Work</Text>
          <Text style={styles.summarySubtitle}>Your current task progress</Text>
          
          <View style={styles.progressCards}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardContent}>
                <Image
                  source={require('@/assets/images/icon/code-circle.png')}
                  style={styles.progressIconImage}
                />
                <Text style={styles.progressLabel}>To Do</Text>
              </View>
              <Text style={styles.progressNumber}>5</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressCardContent}>
                <Image
                  source={require('@/assets/images/icon/task_clock.png')}
                  style={styles.progressIconImage}
                />
                <Text style={styles.progressLabel}>In Progress</Text>
              </View>
              <Text style={styles.progressNumber}>2</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressCardContent}>
                <Image
                  source={require('@/assets/images/icon/tick-circle.png')}
                  style={styles.progressIconImage}
                />
                <Text style={styles.progressLabel}>Done</Text>
              </View>
              <Text style={styles.progressNumber}>1</Text>
            </View>
          </View>
        </View>

        {/* Sprint Stats */}
        <View style={styles.sprintCard}>
          <View style={styles.sprintHeader}>
            <View style={styles.sprintTitleContainer}>
              <Text style={styles.sprintTitle}>Sprint 20 - Burnout Stats</Text>
              <View style={styles.statusTag1}>
                <Text style={styles.statusTagText1}>Poor</Text>
              </View>
            </View>
          </View>
          <Text style={styles.sprintDescription}>
            You've completed 8 more tasks than usual, maintain your task with your supervisor
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

        {/* Filter Bar */}
        <View style={styles.filterBarContainer}>
          <View style={styles.filterBar}>
            <Pressable 
              style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>3</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={[styles.filterButton, selectedFilter === 'inProgress' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('inProgress')}
            >
              <Text style={[styles.filterText, selectedFilter === 'inProgress' && styles.filterTextActive]}>In Progress</Text>
              <View style={[styles.filterBadge, selectedFilter === 'inProgress' && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, selectedFilter === 'inProgress' && styles.filterBadgeTextActive]}>2</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={[styles.filterButton, selectedFilter === 'finish' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('finish')}
            >
              <Text style={[styles.filterText, selectedFilter === 'finish' && styles.filterTextActive]}>Finish</Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>2</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
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
                 <Text style={styles.statusTagText}>{task.status}</Text>
               </View>
               <View style={styles.priorityTag}>
                 <Image
                   source={require('@/assets/images/icon/flag.png')}
                   style={styles.priorityIcon}
                 />
                 <Text style={styles.priorityText}>{task.priority}</Text>
               </View>
             </View>
             
             <View style={styles.progressBar}>
               <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
             </View>
              
              <View style={styles.taskFooter}>
                <View style={styles.assignees}>
                  {task.assignees.map((assignee, index) => (
                    <View key={index} style={[styles.assigneeAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                      <Text style={styles.assigneeText}>{assignee}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.dueDate}>
                  <Image
                    source={require('@/assets/images/icon/calendar2_dis.png')}
                    style={styles.calendarIcon}
                  />
                  <Text style={styles.dueDateText}>{task.dueDate}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 8,
    padding: 20,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101828',
    lineHeight: 19.6, // 140% of 14px
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475467',
    lineHeight: 16.8, // 140% of 12px
    marginBottom: 16,
  },
  progressCards: {
    flexDirection: 'row',
    gap: 16,
  },
  progressCard: {
    flex: 1,
    alignItems: 'left',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBECEE',
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
    color: '#475467',
    letterSpacing: -0.5,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '400',
    color: '#101828',
    letterSpacing: -0.5,
  },
  sprintCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#101828',
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
    color: '#475467',
    lineHeight: 16.8, // 140% of 12px
    marginBottom: 16,
  },
  burnoutIndicatorContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sprintProgressFill: {
    height: '100%',
    backgroundColor: '#FD824C',
    borderRadius: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FD824C',
    borderRadius: 4,
  },
  filterBarContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 0,
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
    color: '#475467',
    numberOfLines: 1,
  },
  filterTextActive: {
    color: '#fefefe',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: '#F1F5F9',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475467',
  },
  filterBadgeTextActive: {
    color: '#475467',
  },
  taskList: {
    paddingHorizontal: 10,
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
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
  statusTagIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
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
  assignees: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#17f196',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  assigneeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: '#475467',
    lineHeight: 16.8, // 140% of 12px
  },
});