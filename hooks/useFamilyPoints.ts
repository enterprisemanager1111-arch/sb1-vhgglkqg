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
// Base achievements configuration (without translations)
const BASE_ACHIEVEMENTS_CONFIG = {
  first_task: {
    points_reward: 10,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'task_completed').length >= 1
  },
  team_player: {
    points_reward: 25,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'task_completed').length >= 10
  },
  streak_master: {
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
    points_reward: 100,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 100
  },
  organizer: {
    points_reward: 30,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'event_created').length >= 5
  },
  helper: {
    points_reward: 40,
    condition: (activities: PointsActivity[]) => 
      activities.filter(a => a.activity_type === 'shopping_item_completed').length >= 20
  },
  milestone_100: {
    points_reward: 50,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 100
  },
  milestone_500: {
    points_reward: 100,
    condition: (activities: PointsActivity[]) => 
      activities.reduce((sum, a) => sum + a.points_earned, 0) >= 500
  },
} as const;

// Function to get translated achievements configuration
export const getAchievementsConfig = (t: (key: string) => string) => {
  return {
    first_task: {
      title: t('profile.achievements.first_task.title'),
      description: t('profile.achievements.first_task.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.first_task.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.first_task.condition
    },
    team_player: {
      title: t('profile.achievements.team_player.title'),
      description: t('profile.achievements.team_player.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.team_player.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.team_player.condition
    },
    streak_master: {
      title: t('profile.achievements.streak_master.title'),
      description: t('profile.achievements.streak_master.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.streak_master.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.streak_master.condition
    },
    family_hero: {
      title: t('profile.achievements.family_hero.title'),
      description: t('profile.achievements.family_hero.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.family_hero.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.family_hero.condition
    },
    organizer: {
      title: t('profile.achievements.organizer.title'),
      description: t('profile.achievements.organizer.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.organizer.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.organizer.condition
    },
    helper: {
      title: t('profile.achievements.helper.title'),
      description: t('profile.achievements.helper.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.helper.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.helper.condition
    },
    milestone_100: {
      title: t('profile.achievements.milestone_100.title'),
      description: t('profile.achievements.milestone_100.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.milestone_100.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.milestone_100.condition
    },
    milestone_500: {
      title: t('profile.achievements.milestone_500.title'),
      description: t('profile.achievements.milestone_500.description'),
      points_reward: BASE_ACHIEVEMENTS_CONFIG.milestone_500.points_reward,
      condition: BASE_ACHIEVEMENTS_CONFIG.milestone_500.condition
    },
  } as const;
};

// Legacy export for backward compatibility (will use English as fallback)
export const ACHIEVEMENTS_CONFIG = {
  first_task: {
    title: 'First Task',
    description: 'First task successfully completed',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.first_task.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.first_task.condition
  },
  team_player: {
    title: 'Team Player',
    description: '10 tasks successfully completed',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.team_player.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.team_player.condition
  },
  streak_master: {
    title: 'Streak Master',
    description: '7 days in a row active',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.streak_master.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.streak_master.condition
  },
  family_hero: {
    title: 'Family Hero',
    description: '100+ points collected',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.family_hero.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.family_hero.condition
  },
  organizer: {
    title: 'Organizer',
    description: '5 events created',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.organizer.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.organizer.condition
  },
  helper: {
    title: 'Helper',
    description: '20 shopping items completed',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.helper.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.helper.condition
  },
  milestone_100: {
    title: 'First 100',
    description: '100 points reached',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.milestone_100.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.milestone_100.condition
  },
  milestone_500: {
    title: 'Halfway!',
    description: '500 points reached',
    points_reward: BASE_ACHIEVEMENTS_CONFIG.milestone_500.points_reward,
    condition: BASE_ACHIEVEMENTS_CONFIG.milestone_500.condition
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
      
      // Points activities API call removed
      let activitiesData = [];

      // Family goals API call removed
      let goalsData = [];

      // Family achievements API call removed
      let achievementsData = [];

      setActivities(activitiesData);
      setGoals(goalsData);
      setAchievements(achievementsData);
    } catch (error: any) {
      console.error('Error loading points data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id, user?.id]);

  // Check achievements function removed - API call disabled
  const checkForAchievements = useCallback(async (userId: string): Promise<Achievement[]> => {
    console.log('Achievement checking disabled - API call removed');
    return [];
  }, []);

  // Update goal progress function removed - API call disabled
  const updateGoalProgress = useCallback(async () => {
    console.log('Goal progress updating disabled - API call removed');
  }, []);

  // Award points function removed - API call disabled
  const awardPoints = useCallback(async (activityData: Omit<PointsActivity, 'id' | 'family_id' | 'user_id' | 'created_at'>) => {
    console.log('Points awarding disabled - API call removed');
  }, []);

  // Create goal function removed - API call disabled
  const createGoal = useCallback(async (goalData: Omit<FamilyGoal, 'id' | 'family_id' | 'created_by' | 'current_points' | 'completed' | 'created_at' | 'updated_at'>) => {
    console.log('Goal creation disabled - API call removed');
  }, []);

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
    
    // Add fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Points loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(fallbackTimeout);
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

    // Real-time subscriptions removed - API calls disabled
    const channel = supabase
      .channel(`family_points_${currentFamily.id}`)
      .subscribe((status) => {
        console.log('Points system subscription disabled - API calls removed');
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