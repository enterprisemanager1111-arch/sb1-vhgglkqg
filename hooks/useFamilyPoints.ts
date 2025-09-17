import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout, withRetry } from '@/utils/loadingOptimization';

export interface PointsActivity {
  id: string;
  family_id: string;
  user_id: string;
  activity_type: 'task_completed' | 'shopping_item_completed' | 'member_added' | 'daily_checkin' | 'event_created' | 'goal_achieved' | 'streak_bonus' | 'family_milestone';
  points_earned: number;
  related_entity_id?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  user_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface FamilyGoal {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  target_points: number;
  current_points: number;
  target_date?: string;
  completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    name: string;
  };
}

export interface Achievement {
  id: string;
  family_id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  points_reward: number;
  unlocked_at: string;
  user_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url?: string;
  total_points: number;
  recent_activities: PointsActivity[];
  achievements_count: number;
  rank: number;
  is_current_user: boolean;
}

interface UseFamilyPointsReturn {
  // Points Activities
  activities: PointsActivity[];
  recentActivities: PointsActivity[];
  
  // Goals
  goals: FamilyGoal[];
  activeGoals: FamilyGoal[];
  completedGoals: FamilyGoal[];
  
  // Achievements  
  achievements: Achievement[];
  userAchievements: Achievement[];
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  currentUserRank: number;
  currentUserPoints: number;
  
  // States
  loading: boolean;
  error: string | null;
  
  // Functions
  awardPoints: (activity: Omit<PointsActivity, 'id' | 'family_id' | 'user_id' | 'created_at'>) => Promise<void>;
  createGoal: (goal: Omit<FamilyGoal, 'id' | 'family_id' | 'created_by' | 'current_points' | 'completed' | 'created_at' | 'updated_at'>) => Promise<void>;
  checkForAchievements: (userId: string) => Promise<Achievement[]>;
  refreshData: () => Promise<void>;
  getUserTotalPoints: (userId: string) => number;
  getPointsForPeriod: (userId: string, days: number) => number;
}

// Points configuration
export const POINTS_CONFIG = {
  task_completed: 15,
  shopping_item_completed: 20,
  member_added: 20,
  daily_checkin: 5,
  event_created: 10,
  goal_achieved: 50,
  streak_bonus: 25,
  family_milestone: 100,
} as const;

// Family Level System
export const FAMILY_LEVELS = [
  { level: 1, points: 0, title: 'Neustart', description: 'Willkommen bei Famora!' },
  { level: 2, points: 100, title: 'Familie', description: 'Erste Schritte gemeistert' },
  { level: 3, points: 500, title: 'Organisiert', description: 'Gute Teamarbeit!' },
  { level: 4, points: 1250, title: 'Eingespielt', description: 'Familie läuft rund' },
  { level: 5, points: 5000, title: 'Profis', description: 'Echte Familienexperten' },
  { level: 6, points: 10000, title: 'Champions', description: 'Überragend organisiert' },
  { level: 7, points: 17500, title: 'Legenden', description: 'Beispielhafte Familie' },
  { level: 8, points: 25000, title: 'Meister', description: 'Perfekte Harmonie' },
  { level: 9, points: 50000, title: 'Elite', description: 'Unerreichte Perfektion' },
  { level: 10, points: 100000, title: 'Unsterblich', description: 'Familien-Götter' },
] as const;

// Helper functions for level system
export const getCurrentLevel = (totalPoints: number): typeof FAMILY_LEVELS[number] => {
  for (let i = FAMILY_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= FAMILY_LEVELS[i].points) {
      return FAMILY_LEVELS[i];
    }
  }
  return FAMILY_LEVELS[0];
};

export const getNextLevel = (totalPoints: number): typeof FAMILY_LEVELS[number] | null => {
  for (let i = 0; i < FAMILY_LEVELS.length; i++) {
    if (totalPoints < FAMILY_LEVELS[i].points) {
      return FAMILY_LEVELS[i];
    }
  }
  return null; // Max level reached
};

export const getLevelProgress = (totalPoints: number): { current: number; next: number; percentage: number } => {
  const currentLevel = getCurrentLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  
  if (!nextLevel) {
    return { current: currentLevel.points, next: currentLevel.points, percentage: 100 };
  }
  
  const progressInLevel = totalPoints - currentLevel.points;
  const levelRange = nextLevel.points - currentLevel.points;
  const percentage = levelRange > 0 ? (progressInLevel / levelRange) * 100 : 0;
  
  return {
    current: currentLevel.points,
    next: nextLevel.points,
    percentage: Math.min(100, Math.max(0, percentage))
  };
};
// Achievements configuration
export const ACHIEVEMENTS_CONFIG = {
  first_task: {
    title: 'Erste Aufgabe',
    description: 'Erste Task erfolgreich erledigt',
    points_reward: 10,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'task_completed').length >= 1
  },
  team_player: {
    title: 'Team Player',
    description: '10 Tasks erfolgreich erledigt',
    points_reward: 25,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'task_completed').length >= 10
  },
  streak_master: {
    title: 'Streak Master',
    description: '7 Tage in Folge aktiv',
    points_reward: 50,
    condition: (activities: PointsActivity[]) => {
      // Check for 7 consecutive days of activity
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const hasActivity = activities.some(activity => 
          activity.created_at.startsWith(dateString)
        );
        
        if (!hasActivity) return false;
      }
      return true;
    }
  },
  family_hero: {
    title: 'Familien-Hero',
    description: '100+ Punkte gesammelt',
    points_reward: 100,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 100
  },
  organizer: {
    title: 'Organisator',
    description: '5 Events erstellt',
    points_reward: 30,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'event_created').length >= 5
  },
  helper: {
    title: 'Helfer',
    description: '20 Einkäufe erledigt',
    points_reward: 40,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'shopping_item_completed').length >= 20
  },
  milestone_100: {
    title: 'Erste 100',
    description: '100 Punkte erreicht',
    points_reward: 50,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 100
  },
  milestone_500: {
    title: 'Halbzeit!',
    description: '500 Punkte erreicht',
    points_reward: 100,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 500
  },
} as const;

export const useFamilyPoints = (): UseFamilyPointsReturn => {
  const [activities, setActivities] = useState<PointsActivity[]>([]);
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentFamily, familyMembers } = useFamily();

  // Load all points data
  const loadData = useCallback(async () => {
    if (!currentFamily || !user) {
      setActivities([]);
      setGoals([]);
      setAchievements([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Load points activities
      const { data: activitiesData, error: activitiesError } = await withTimeout(
        supabase
          .from('family_points_activities')
          .select(`
            *,
            user_profile:profiles!user_id (
              name,
              avatar_url
            )
          `)
          .eq('family_id', currentFamily.id)
          .order('created_at', { ascending: false })
          .limit(100),
        5000
      );

      if (activitiesError) throw activitiesError;

      // Load family goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('family_goals')
        .select(`
          *,
          creator_profile:profiles!created_by (
            name
          )
        `)
        .eq('family_id', currentFamily.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('family_achievements')
        .select(`
          *,
          user_profile:profiles!user_id (
            name,
            avatar_url
          )
        `)
        .eq('family_id', currentFamily.id)
        .order('unlocked_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      setActivities(activitiesData || []);
      setGoals(goalsData || []);
      setAchievements(achievementsData || []);
    } catch (error: any) {
      console.error('Error loading points data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id, user?.id]);

  // Check for new achievements (defined early to avoid temporal dead zone)
  const checkForAchievements = useCallback(async (userId: string): Promise<Achievement[]> => {
    if (!currentFamily) return [];

    try {
      // Fetch fresh data instead of using state
      const { data: familyActivities } = await supabase
        .from('family_points_activities')
        .select('*')
        .eq('family_id', currentFamily.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: existingAchievements } = await supabase
        .from('family_achievements')
        .select('achievement_type')
        .eq('family_id', currentFamily.id);

      const existingTypes = existingAchievements?.map(a => a.achievement_type) || [];
      const newAchievements: Achievement[] = [];

      // Check each achievement type
      for (const [type, config] of Object.entries(ACHIEVEMENTS_CONFIG)) {
        if (existingTypes.includes(type)) continue; // Already unlocked
        
        if (config.condition(familyActivities || [])) {
          // Unlock achievement
          const { data: newAchievement, error } = await supabase
            .from('family_achievements')
            .insert([{
              family_id: currentFamily.id,
              user_id: userId, // User who unlocked the achievement
              achievement_type: type,
              title: config.title,
              description: config.description,
              points_reward: config.points_reward,
            }])
            .select(`
              *,
              user_profile:profiles!user_id (
                name,
                avatar_url
              )
            `)
            .single();

          if (!error && newAchievement) {
            newAchievements.push(newAchievement);
          }
        }
      }

      return newAchievements;
    } catch (error: any) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }, [currentFamily?.id]);

  // Update goal progress based on current points (defined before awardPoints)
  const updateGoalProgress = useCallback(async () => {
    if (!currentFamily) return;

    try {
      // Fetch fresh goals data instead of using state
      const { data: goalsData } = await supabase
        .from('family_goals')
        .select('id')
        .eq('family_id', currentFamily.id)
        .eq('completed', false);

      if (goalsData) {
        for (const goal of goalsData) {
          await supabase.rpc('update_goal_progress', { target_goal_id: goal.id });
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  }, [currentFamily?.id]);

  // Award points for an activity
  const awardPoints = useCallback(async (activityData: Omit<PointsActivity, 'id' | 'family_id' | 'user_id' | 'created_at'>) => {
    if (!currentFamily || !user) {
      throw new Error('User must be in a family to award points');
    }

    try {
      const pointsToAward = POINTS_CONFIG[activityData.activity_type] || 0;

      const { error } = await withRetry(
        () => supabase
          .from('family_points_activities')
          .insert([{
            ...activityData,
            family_id: currentFamily.id,
            user_id: user.id,
            points_earned: pointsToAward,
          }]),
        3,
        1000
      );

      if (error) throw error;

      // Check for new achievements
      await checkForAchievements(user.id);

      // Update goal progress
      await updateGoalProgress();

      // Note: Real-time subscriptions will handle data refresh automatically
    } catch (error: any) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }, [currentFamily?.id, user?.id, checkForAchievements, updateGoalProgress]);

  // Create a new family goal
  const createGoal = useCallback(async (goalData: Omit<FamilyGoal, 'id' | 'family_id' | 'created_by' | 'current_points' | 'completed' | 'created_at' | 'updated_at'>) => {
    if (!currentFamily || !user) {
      throw new Error('User must be in a family to create goals');
    }

    try {
      const { error } = await supabase
        .from('family_goals')
        .insert([{
          ...goalData,
          family_id: currentFamily.id,
          created_by: user.id,
          current_points: 0,
          completed: false,
        }]);

      if (error) throw error;

      // Note: Real-time subscriptions will handle data refresh automatically
      
      // Check for new achievements after creating goal
      await checkForAchievements(user.id);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }, [currentFamily?.id, user?.id, checkForAchievements]);

  // Generate leaderboard
  const leaderboard: LeaderboardEntry[] = familyMembers.map(member => {
    const memberActivities = activities.filter(a => a.user_id === member.user_id);
    const memberAchievements = achievements.filter(a => a.user_id === member.user_id);
    const totalPoints = memberActivities.reduce((sum, activity) => sum + activity.points_earned, 0);
    
    return {
      user_id: member.user_id,
      name: member.profiles?.name || 'Unknown',
      avatar_url: member.profiles?.avatar_url,
      total_points: totalPoints,
      recent_activities: memberActivities.slice(0, 5),
      achievements_count: memberAchievements.length,
      rank: 0, // Will be set after sorting
      is_current_user: member.user_id === user?.id,
    };
  })
  .sort((a, b) => b.total_points - a.total_points)
  .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Utility functions
  const getUserTotalPoints = useCallback((userId: string) => {
    return activities
      .filter(a => a.user_id === userId)
      .reduce((sum, activity) => sum + activity.points_earned, 0);
  }, [activities]);

  const getPointsForPeriod = useCallback((userId: string, days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return activities
      .filter(a => a.user_id === userId && new Date(a.created_at) >= cutoffDate)
      .reduce((sum, activity) => sum + activity.points_earned, 0);
  }, [activities]);

  // Computed values
  const recentActivities = activities.slice(0, 10);
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const userAchievements = achievements.filter(a => a.user_id === user?.id);
  const currentUserEntry = leaderboard.find(entry => entry.is_current_user);
  const currentUserRank = currentUserEntry?.rank || 0;
  const currentUserPoints = currentUserEntry?.total_points || 0;

  // Load data on mount and family change
  useEffect(() => {
    loadData();
  }, [currentFamily?.id, user?.id]); // Use stable dependencies instead of loadData

  // Setup real-time subscriptions with debouncing
  useEffect(() => {
    if (!currentFamily) return;

    console.log('Setting up real-time subscription for points system:', currentFamily.id);

    let debounceTimeout: NodeJS.Timeout;

    const debouncedLoadData = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadData();
      }, 500); // 500ms debounce
    };

    const channel = supabase
      .channel(`family_points_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_points_activities',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time points activity change:', payload);
          debouncedLoadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_goals',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time goal change:', payload);
          debouncedLoadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_achievements',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time achievement change:', payload);
          debouncedLoadData();
        }
      )
      .subscribe((status) => {
        console.log('Points system subscription status:', status);
      });

    return () => {
      console.log('Cleaning up points system subscription');
      clearTimeout(debounceTimeout);
      channel.unsubscribe();
    };
  }, [currentFamily?.id]); // Remove loadData dependency

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    activities,
    recentActivities,
    goals,
    activeGoals,
    completedGoals,
    achievements,
    userAchievements,
    leaderboard,
    currentUserRank,
    currentUserPoints,
    loading,
    error,
    awardPoints,
    createGoal,
    checkForAchievements,
    refreshData,
    getUserTotalPoints,
    getPointsForPeriod,
  };
};