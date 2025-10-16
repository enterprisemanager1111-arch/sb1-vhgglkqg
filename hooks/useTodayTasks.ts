import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TodayTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  points: number;
  category: string;
  due_date?: string;
  end_date?: string;
  created_by: string;
  family_id: string;
  created_at: string;
  updated_at: string;
  assignee_profile?: {
    name: string;
    avatar_url?: string;
  };
  creator_profile?: {
    name: string;
    avatar_url?: string;
  };
  // Removed task_assignments for simpler implementation
}

interface UseTodayTasksReturn {
  tasks: TodayTask[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
}

export const useTodayTasks = (): UseTodayTasksReturn => {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTodayTasks = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching today\'s tasks for user:', user.id);
      
      // Call the get_today_tasks_with_details RPC function
      const { data: tasks, error } = await supabase
        .rpc('get_today_tasks_with_details', {
          _user_id: user.id
        });

      if (error) {
        console.error('❌ Error fetching today\'s tasks:', error);
        setError(error.message);
        setTasks([]);
        return;
      }

      console.log('📋 Today\'s tasks fetched:', tasks);
      console.log('📋 Tasks count:', tasks?.length || 0);
      console.log('📋 Raw tasks data:', JSON.stringify(tasks, null, 2));
      
      // Debug task details
      if (tasks && tasks.length > 0) {
        tasks.forEach((task, index) => {
          console.log(`📋 Task ${index + 1} (${task.title}):`, {
            completed: task.completed,
            category: task.category,
            points: task.points,
            due_date: task.due_date,
            assignee_profile: task.assignee_profile,
            creator_profile: task.creator_profile
          });
        });
      } else {
        console.log('📋 No tasks found for today');
        console.log('📋 User ID:', user.id);
        console.log('📋 Current date:', new Date().toISOString().split('T')[0]);
      }

      setTasks(tasks || []);
      setError(null);
    } catch (err) {
      console.error('Today\'s tasks fetch error:', err);
      setError('Failed to load today\'s tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshTasks = useCallback(async () => {
    await fetchTodayTasks();
  }, [fetchTodayTasks]);

  useEffect(() => {
    fetchTodayTasks();
  }, [fetchTodayTasks]);

  return {
    tasks,
    loading,
    error,
    refreshTasks
  };
};
