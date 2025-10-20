import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withSupabaseRetry, withFetchRetry } from '../utils/apiRetry';
import { withTimeout, withRetry } from '@/utils/loadingOptimization';
import { PointsService } from '@/services/pointsService';

export interface TaskAssignment {
  id: string;
  assignee_id: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_at: string;
  completed_at?: string;
  assignee_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface FamilyTask {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  assignee_id?: string; // Keep for backward compatibility
  completed: boolean;
  points: number;
  category: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
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
  task_assignments?: TaskAssignment[];
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
  const isLoadingRef = useRef(false);
  
  const { user } = useAuth();
  const { currentFamily, refreshFamily } = useFamily();

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    console.log('🔄 loadTasks called with:', { 
      currentFamily: currentFamily?.id, 
      user: user?.id 
    });
    
    if (!currentFamily || !user) {
      console.log('⚠️ No family or user, clearing tasks');
      setTasks([]);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('⚠️ Already loading tasks, skipping duplicate call');
      return;
    }

    // Set loading state at the start
    isLoadingRef.current = true;
    setLoading(true);

    try {
      setError(null);
      
      // Try the complex query first, fallback to simple query if it fails
      let data, tasksError;
      
      // Use get_all_tasks function for better data structure
      console.log('🔧 Loading tasks using get_all_tasks function...');
      console.log('🔧 Family ID:', currentFamily.id);
      
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_all_tasks', {
            _user_id: user.id
          });
        
        console.log('🔧 Function response:', { functionData, functionError });
        
        data = functionData;
        tasksError = functionError;
        
        console.log('📊 Tasks loaded from database:', data?.length || 0);
        console.log('📊 Sample task data:', data?.[0]);
        
        if (tasksError) {
          console.error('❌ get_all_tasks function failed:', tasksError);
          console.error('❌ Function error details:', {
            message: tasksError.message,
            details: tasksError.details,
            hint: tasksError.hint,
            code: tasksError.code
          });
          throw tasksError;
        }
      } catch (queryError: any) {
        console.error('❌ get_all_tasks function failed:', queryError);
        console.error('❌ Query error details:', {
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          code: queryError.code
        });
        throw queryError;
      }
      
      // The get_all_tasks function already returns all profile data and assignments
      console.log('✅ Tasks loaded with profiles and assignments from function');

      if (tasksError) throw tasksError;

      console.log('📊 Setting tasks in state:', data?.map((t: any) => ({ 
        id: t.id, 
        title: t.title, 
        start_date: t.start_date, 
        end_date: t.end_date 
      })));
      console.log('📊 Total tasks to set:', data?.length || 0);
      setTasks(data || []);
      console.log('📊 Tasks state updated');
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
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
        // Remove assignee_id - assignments go to task_assignment table
        assignee_id: undefined
      };
      
      console.log('🔧 Inserting data:', insertData);
      console.log('🔧 About to call Supabase insert...');
      
      // Try HTTP API approach first to bypass GoTrueClient lock issues
      console.log('🔧 Attempting HTTP API approach to bypass GoTrueClient lock issues...');
      
      try {
        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('No valid session found');
        }
        
        console.log('🔧 Making HTTP request to create task...');
        
        // Make HTTP request to create task with retry
        const response = await withFetchRetry(
          `${(supabase as any).supabaseUrl}/rest/v1/family_tasks`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': (supabase as any).supabaseKey,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(insertData)
          },
          { maxRetries: 2, timeout: 15000 }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Task created successfully via HTTP API:', data);
        
      } catch (httpError: any) {
        console.warn('⚠️ HTTP API approach failed, trying Supabase client:', httpError);
        
        // Fallback to Supabase client
        try {
          const { data, error } = await supabase
            .from('family_tasks')
            .insert([insertData])
            .select();
          
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
          
          console.log('✅ Task created successfully via Supabase client:', data);
          
        } catch (insertError: any) {
          console.error('❌ Both HTTP API and Supabase client failed:', insertError);
          throw insertError;
        }
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

  // Auto-cleanup removed - no longer needed

  // Auto-cleanup removed - no longer needed
  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    console.log('🔄 Manual refresh of tasks requested');
    console.log('🔄 Current tasks before refresh:', tasks.length);
    console.log('🔄 Current family:', currentFamily?.id);
    console.log('🔄 Current user:', user?.id);
    await loadTasks();
    console.log('🔄 Tasks after refresh:', tasks.length);
  }, [loadTasks, tasks.length, currentFamily?.id, user?.id]);

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
    console.log('🔄 useEffect triggered - loading tasks');
    console.log('🔄 currentFamily?.id:', currentFamily?.id);
    console.log('🔄 user?.id:', user?.id);
    
    // Only load if we have required data
    if (currentFamily?.id && user?.id) {
      console.log('🔄 Calling loadTasks...');
      loadTasks();
    } else {
      console.log('🔄 Skipping loadTasks - missing family or user');
    }
  }, [currentFamily?.id, user?.id]); // Removed loading from dependencies

  // Remove periodic refresh to prevent too many API calls
  // Periodic refresh removed - tasks will be refreshed manually or on focus



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