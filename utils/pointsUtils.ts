/**
 * Points System Utilities
 * Helper functions for points calculation, streak tracking, and achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { POINTS_CONFIG } from '@/hooks/useFamilyPoints';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string; // ISO date string
  streakBonusEarned: boolean;
}

const STREAK_STORAGE_KEY = '@famora_user_streak';
const DAILY_CHECKIN_KEY = '@famora_daily_checkin';

/**
 * Check if user has checked in today
 */
export const hasCheckedInToday = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = await AsyncStorage.getItem(`${DAILY_CHECKIN_KEY}_${userId}`);
    return lastCheckin === today;
  } catch (error) {
    console.error('Error checking daily checkin:', error);
    return false;
  }
};

/**
 * Perform daily check-in and update streak
 */
export const performDailyCheckIn = async (userId: string): Promise<{
  isFirstToday: boolean;
  streakDays: number;
  bonusPoints: number;
}> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const hasCheckedIn = await hasCheckedInToday(userId);
    
    if (hasCheckedIn) {
      return { isFirstToday: false, streakDays: 0, bonusPoints: 0 };
    }

    // Mark today as checked in
    await AsyncStorage.setItem(`${DAILY_CHECKIN_KEY}_${userId}`, today);

    // Update streak
    const streakData = await updateUserStreak(userId);
    
    // Calculate bonus points for streaks
    let bonusPoints = 0;
    if (streakData.currentStreak >= 7 && streakData.currentStreak % 7 === 0) {
      bonusPoints = POINTS_CONFIG.streak_bonus;
    }

    return {
      isFirstToday: true,
      streakDays: streakData.currentStreak,
      bonusPoints,
    };
  } catch (error) {
    console.error('Error performing daily check-in:', error);
    return { isFirstToday: false, streakDays: 0, bonusPoints: 0 };
  }
};

/**
 * Update user's activity streak
 */
export const updateUserStreak = async (userId: string): Promise<StreakData> => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Load existing streak data
    const existingData = await AsyncStorage.getItem(`${STREAK_STORAGE_KEY}_${userId}`);
    let streakData: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: '',
      streakBonusEarned: false,
    };

    if (existingData) {
      streakData = JSON.parse(existingData);
    }

    // Check if this continues the streak
    if (streakData.lastCheckIn === yesterdayString) {
      // Continuing streak
      streakData.currentStreak += 1;
    } else if (streakData.lastCheckIn === todayString) {
      // Already checked in today
      return streakData;
    } else {
      // Streak broken, start new
      streakData.currentStreak = 1;
    }

    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    streakData.lastCheckIn = todayString;

    // Save updated data
    await AsyncStorage.setItem(`${STREAK_STORAGE_KEY}_${userId}`, JSON.stringify(streakData));

    return streakData;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

/**
 * Get user's current streak data
 */
export const getUserStreak = async (userId: string): Promise<StreakData | null> => {
  try {
    const data = await AsyncStorage.getItem(`${STREAK_STORAGE_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user streak:', error);
    return null;
  }
};

/**
 * Calculate points multiplier based on streak
 */
export const getStreakMultiplier = (streakDays: number): number => {
  if (streakDays >= 30) return 2.0; // Double points for 30+ day streaks
  if (streakDays >= 14) return 1.5; // 50% bonus for 2+ week streaks
  if (streakDays >= 7) return 1.2;  // 20% bonus for 1+ week streaks
  return 1.0; // No bonus
};

/**
 * Award daily check-in points with potential streak bonuses
 */
export const awardDailyCheckInPoints = async (
  userId: string,
  awardPointsFunction: (activity: any) => Promise<void>
): Promise<{ success: boolean; points: number; streakDays: number }> => {
  try {
    const checkInResult = await performDailyCheckIn(userId);
    
    if (!checkInResult.isFirstToday) {
      return { success: false, points: 0, streakDays: 0 };
    }

    // Award base check-in points
    const basePoints = POINTS_CONFIG.daily_checkin;
    await awardPointsFunction({
      activity_type: 'daily_checkin',
      description: `Täglicher Check-in (Tag ${checkInResult.streakDays})`,
      metadata: {
        streak_days: checkInResult.streakDays,
        is_streak_bonus: false,
      },
    });

    let totalPoints = basePoints;

    // Award streak bonus if applicable
    if (checkInResult.bonusPoints > 0) {
      await awardPointsFunction({
        activity_type: 'streak_bonus',
        description: `Streak-Bonus: ${checkInResult.streakDays} Tage in Folge!`,
        metadata: {
          streak_days: checkInResult.streakDays,
          bonus_points: checkInResult.bonusPoints,
        },
      });
      
      totalPoints += checkInResult.bonusPoints;
    }

    return {
      success: true,
      points: totalPoints,
      streakDays: checkInResult.streakDays,
    };
  } catch (error) {
    console.error('Error awarding daily check-in points:', error);
    return { success: false, points: 0, streakDays: 0 };
  }
};

/**
 * Helper to format points display
 */
export const formatPoints = (points: number): string => {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
};

/**
 * Helper to get activity type display name
 */
export const getActivityDisplayName = (activityType: string): string => {
  const displayNames = {
    task_completed: 'Aufgabe erledigt',
    shopping_item_completed: 'Einkauf erledigt',
    member_added: 'Mitglied hinzugefügt',
    daily_checkin: 'Täglicher Check-in',
    event_created: 'Event erstellt',
    goal_achieved: 'Ziel erreicht',
    streak_bonus: 'Streak-Bonus',
    family_milestone: 'Familien-Meilenstein',
  };
  
  return displayNames[activityType as keyof typeof displayNames] || activityType;
};

/**
 * Calculate activity score for engagement metrics
 */
export const calculateActivityScore = (activities: any[], days: number = 7): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentActivities = activities.filter(
    activity => new Date(activity.created_at) >= cutoffDate
  );
  
  // Weight different activities
  const weights = {
    task_completed: 3,
    shopping_item_completed: 2,
    event_created: 4,
    daily_checkin: 1,
    member_added: 5,
    goal_achieved: 10,
  };
  
  return recentActivities.reduce((score, activity) => {
    const weight = weights[activity.activity_type as keyof typeof weights] || 1;
    return score + weight;
  }, 0);
};