import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout, withRetry } from '@/utils/loadingOptimization';
import { PointsService } from '@/services/pointsService';

export interface FamilyTask {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  completed: boolean;
  points: number;
  category: string;
  due_date?: string;
  created_by: string;
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
}

interface UseFamilyTasksReturn {
  tasks: FamilyTask[];
  loading: boolean;
  error: string | null;
  createTask: (task: Omit<FamilyTask, 'id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<FamilyTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  getTasksByCategory: (category: string) => FamilyTask[];
  getTasksByAssignee: (assigneeId: string) => FamilyTask[];
  getCompletedTasks: () => FamilyTask[];
  getPendingTasks: () => FamilyTask[];
}

export const useFamilyTasks = (): UseFamilyTasksReturn => {
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentFamily } = useFamily();

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    if (!currentFamily || !user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: tasksError } = await supabase
        .from('family_tasks')
        .select(`
          *,
          assignee_profile:profiles!assignee_id (
            name,
            avatar_url
          ),
          creator_profile:profiles!created_by (
            name,
            avatar_url
          )
        `)
        .eq('family_id', currentFamily.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily, user]);

  // Create new task
  const createTask = useCallback(async (taskData: Omit<FamilyTask, 'id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    console.log('🔧 createTask hook called with:', taskData);
    console.log('🔧 currentFamily:', currentFamily?.id);
    console.log('🔧 user:', user?.id);
    
    if (!currentFamily || !user) {
      console.error('❌ Missing family or user');
      throw new Error('User must be in a family to create tasks');
    }

    try {
      const insertData = {
        ...taskData,
        family_id: currentFamily.id,
        created_by: user.id,
      };
      
      console.log('🔧 Inserting data:', insertData);
      console.log('🔧 About to call Supabase insert...');
      
      // Skip authentication synchronization - it's also hanging due to GoTrueClient lock
      console.log('🔧 Skipping authentication synchronization - going directly to database operation...');
      
      try {
        // Add timeout to prevent hanging
        const insertPromise = supabase
          .from('family_tasks')
          .insert([insertData])
          .select();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database operation timed out after 5 seconds')), 5000);
        });

        const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;
          
        console.log('🔧 Insert completed:', { data, error });
        
        if (error) {
          console.error('❌ Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('✅ Task created successfully:', data);
        
      } catch (insertError: any) {
        console.error('❌ Insert operation failed:', insertError);
        throw insertError;
      }

      console.log('✅ Task inserted successfully, refreshing tasks...');
      // Refresh tasks list
      await loadTasks();
      console.log('✅ Tasks refreshed');
    } catch (error: any) {
      console.error('❌ Error in createTask hook:', error);
      throw error;
    }
  }, [currentFamily, user, loadTasks]);

  // Update task
  const updateTask = useCallback(async (id: string, updates: Partial<FamilyTask>) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('family_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh tasks list
      await loadTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [currentFamily, loadTasks]);

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('family_tasks')
        .delete()
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh tasks list
      await loadTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [currentFamily, loadTasks]);

  // Toggle task completion
  const toggleTaskCompletion = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return;

    const wasCompleted = task.completed;
    
    // Only allow marking as completed, not uncompleting
    if (wasCompleted) {
      console.log('Task is already completed, cannot undo');
      return;
    }
    
    const newCompletedState = true;
    
    await updateTask(id, { completed: newCompletedState });
    
    // Award points when task is completed
    if (currentFamily && user) {
      try {
        await PointsService.awardTaskCompletion(
          currentFamily.id,
          user.id,
          task.id,
          task.title,
          task.category,
          task.points
        );
      } catch (error) {
        console.error('Error awarding points for task completion:', error);
      }
    }
  }, [tasks, updateTask, currentFamily, user]);

  // Auto-cleanup completed tasks after 24 hours
  const cleanupCompletedTasks = useCallback(async () => {
    if (!currentFamily) return;

    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { error } = await supabase
        .from('family_tasks')
        .delete()
        .eq('family_id', currentFamily.id)
        .eq('completed', true)
        .lt('updated_at', twentyFourHoursAgo.toISOString());

      if (error) {
        console.error('Error cleaning up completed tasks:', error);
      } else {
        console.log('Cleaned up tasks older than 24 hours');
        await loadTasks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error in cleanup process:', error);
    }
  }, [currentFamily, loadTasks]);

  // Run cleanup on mount and every hour
  useEffect(() => {
    cleanupCompletedTasks();
    
    const cleanupInterval = setInterval(() => {
      cleanupCompletedTasks();
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(cleanupInterval);
  }, [cleanupCompletedTasks]);
  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // Filter functions
  const getTasksByCategory = useCallback((category: string) => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  const getTasksByAssignee = useCallback((assigneeId: string) => {
    return tasks.filter(task => task.assignee_id === assigneeId);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.completed);
  }, [tasks]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  // Load tasks on mount and family change
  useEffect(() => {
    loadTasks();
  }, [currentFamily?.id, user?.id, loadTasks]);

  // Setup real-time subscription with debouncing
  useEffect(() => {
    if (!currentFamily) return;

    console.log('Setting up real-time subscription for tasks:', currentFamily.id);

    let debounceTimeout: NodeJS.Timeout;

    const debouncedLoadTasks = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadTasks();
      }, 500) as unknown as NodeJS.Timeout; // 500ms debounce
    };

    const channel = supabase
      .channel(`family_tasks_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_tasks',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time task change:', payload);
          debouncedLoadTasks();
        }
      )
      .subscribe((status) => {
        console.log('Tasks subscription status:', status);
      });

    return () => {
      console.log('Cleaning up tasks subscription');
      clearTimeout(debounceTimeout);
      channel.unsubscribe();
    };
  }, [currentFamily?.id]); // Remove loadTasks dependency

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    refreshTasks,
    getTasksByCategory,
    getTasksByAssignee,
    getCompletedTasks,
    getPendingTasks,
  };
};