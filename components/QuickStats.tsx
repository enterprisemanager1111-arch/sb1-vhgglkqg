import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { TrendingUp, SquareCheck as CheckSquare, Calendar, Plus } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickStatsProps {
  completedTasks: number;
  totalTasks: number;
  upcomingEvents: number;
  familyProgress: number;
  onAddTask?: () => void;
  onAddEvent?: () => void;
}

export default function QuickStats({
  completedTasks,
  totalTasks,
  upcomingEvents,
  familyProgress,
  onAddTask,
  onAddEvent
}: QuickStatsProps) {
  const addTaskScale = useSharedValue(1);
  const addEventScale = useSharedValue(1);

  const addTaskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addTaskScale.value }],
  }));

  const addEventAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addEventScale.value }],
  }));

  const handleTaskPressIn = () => {
    addTaskScale.value = withSpring(0.95);
  };

  const handleTaskPressOut = () => {
    addTaskScale.value = withSpring(1);
  };

  const handleEventPressIn = () => {
    addEventScale.value = withSpring(0.95);
  };

  const handleEventPressOut = () => {
    addEventScale.value = withSpring(1);
  };

  return (
    <View style={styles.container}>
      {/* Main Progress Circle */}
      <View style={styles.progressSection}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercentage}>{familyProgress}%</Text>
          <Text style={styles.progressLabel}>Fortschritt</Text>
        </View>
        <Text style={styles.progressTitle}>Familie Organisation</Text>
        <Text style={styles.progressSubtitle}>
          {completedTasks} von {totalTasks} Aufgaben erledigt
        </Text>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Tasks Stat with Quick Add */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.statIcon}>
              <CheckSquare size={18} color="#54FE54" strokeWidth={2} />
            </View>
            {onAddTask && (
              <AnimatedPressable
                style={[styles.quickAddButton, addTaskAnimatedStyle]}
                onPress={onAddTask}
                onPressIn={handleTaskPressIn}
                onPressOut={handleTaskPressOut}
              >
                <Plus size={12} color="#54FE54" strokeWidth={2} />
              </AnimatedPressable>
            )}
          </View>
          <Text style={styles.statNumber}>{completedTasks}</Text>
          <Text style={styles.statLabel}>Aufgaben</Text>
          <Text style={styles.statSubLabel}>heute erledigt</Text>
        </View>

        {/* Events Stat with Quick Add */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.statIcon}>
              <Calendar size={18} color="#54FE54" strokeWidth={2} />
            </View>
            {onAddEvent && (
              <AnimatedPressable
                style={[styles.quickAddButton, addEventAnimatedStyle]}
                onPress={onAddEvent}
                onPressIn={handleEventPressIn}
                onPressOut={handleEventPressOut}
              >
                <Plus size={12} color="#54FE54" strokeWidth={2} />
              </AnimatedPressable>
            )}
          </View>
          <Text style={styles.statNumber}>{upcomingEvents}</Text>
          <Text style={styles.statLabel}>Termine</Text>
          <Text style={styles.statSubLabel}>diese Woche</Text>
        </View>

        {/* Overall Trend */}
        <View style={[styles.statCard, styles.trendCard]}>
          <View style={styles.statIcon}>
            <TrendingUp size={18} color="#54FE54" strokeWidth={2} />
          </View>
          <Text style={styles.statNumber}>{familyProgress}%</Text>
          <Text style={styles.statLabel}>Trend</Text>
          <Text style={styles.statSubLabel}>
            {familyProgress >= 70 ? 'Ausgezeichnet!' : 
             familyProgress >= 50 ? 'Gut unterwegs' : 'Verbesserbar'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#54FE54',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#54FE54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
  },
  progressLabel: {
    fontSize: 10,
    color: '#161618',
    fontFamily: 'Montserrat-Medium',
    opacity: 0.8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  trendCard: {
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(84, 254, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(84, 254, 84, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#161618',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#161618',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
});