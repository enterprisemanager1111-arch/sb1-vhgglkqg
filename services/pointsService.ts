import { supabase } from '@/lib/supabase';
import { withRetry } from '@/utils/loadingOptimization';

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

/**
 * Service for awarding points without causing circular dependencies
 * This service doesn't use React hooks and can be called from any hook
 */
export class PointsService {
  /**
   * Award points for an activity
   */
  static async awardPoints(
    familyId: string,
    userId: string,
    activityData: Omit<PointsActivity, 'id' | 'family_id' | 'user_id' | 'created_at'>
  ): Promise<void> {
    try {
      const pointsToAward = POINTS_CONFIG[activityData.activity_type] || 0;

      const { error } = await withRetry(
        () => supabase
          .from('family_points_activities')
          .insert([{
            ...activityData,
            family_id: familyId,
            user_id: userId,
            points_earned: pointsToAward,
          }]),
        3,
        1000
      );

      if (error) throw error;

      console.log(`Awarded ${pointsToAward} points for ${activityData.activity_type}`);
    } catch (error: any) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Award points for task completion
   */
  static async awardTaskCompletion(
    familyId: string,
    userId: string,
    taskId: string,
    taskTitle: string,
    taskCategory: string,
    taskPoints: number
  ): Promise<void> {
    return this.awardPoints(familyId, userId, {
      activity_type: 'task_completed',
      related_entity_id: taskId,
      description: `Aufgabe erledigt: ${taskTitle}`,
      metadata: {
        task_title: taskTitle,
        task_category: taskCategory,
        task_points: taskPoints,
      },
    });
  }

  /**
   * Award points for shopping item completion
   */
  static async awardShoppingCompletion(
    familyId: string,
    userId: string,
    itemId: string,
    itemName: string,
    itemCategory: string
  ): Promise<void> {
    return this.awardPoints(familyId, userId, {
      activity_type: 'shopping_item_completed',
      related_entity_id: itemId,
      description: `Einkauf erledigt: ${itemName}`,
      metadata: {
        item_name: itemName,
        item_category: itemCategory,
      },
    });
  }

  /**
   * Award points for event creation
   */
  static async awardEventCreation(
    familyId: string,
    userId: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    return this.awardPoints(familyId, userId, {
      activity_type: 'event_created',
      description: `Event erstellt: ${eventTitle}`,
      metadata: {
        event_title: eventTitle,
        event_date: eventDate,
      },
    });
  }
}
