import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
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

    try {
      setError(null);
      
      // Try the complex query first, fallback to simple query if it fails
      let data, tasksError;
      
      // Start with simple query to avoid foreign key relationship issues
      console.log('🔧 Loading tasks with simple query to avoid foreign key issues...');
      
      try {
        const simpleResult = await supabase
          .from('family_tasks')
          .select('*')
          .eq('family_id', currentFamily.id)
          .order('created_at', { ascending: false });
        
        data = simpleResult.data;
        tasksError = simpleResult.error;
        
        console.log('📊 Tasks loaded from database:', data?.length || 0);
        console.log('📊 Sample task data:', data?.[0]);
        
        if (tasksError) {
          console.error('❌ Simple query failed:', tasksError);
          throw tasksError;
        }
      } catch (queryError: any) {
        console.error('❌ Database query failed:', queryError);
        
        // Check if it's a schema issue
        if (queryError.message && queryError.message.includes('assignee_id')) {
          console.error('❌ Database schema issue: assignee_id column missing from family_tasks table');
          console.error('❌ Please run the fix_actual_database_schema.sql script on your database');
        }
        
        throw queryError;
      }
      
      // If we have data, fetch profiles separately to avoid foreign key issues
      if (data && data.length > 0) {
        console.log('🔧 Fetching profiles separately to avoid foreign key issues...');
        
        try {
          // Fetch creator profiles
          const creatorIds = [...new Set(data.map(task => task.created_by))];
          const { data: creatorProfiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', creatorIds);
          
          // Fetch assignee profiles
          const assigneeIds = [...new Set(data.map(task => task.assignee_id).filter(Boolean))];
          const { data: assigneeProfiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', assigneeIds);
          
          // Try to fetch task assignments (if table exists)
          let assignments: any[] = [];
          try {
            const taskIds = data.map(task => task.id);
            const { data: assignmentData } = await supabase
              .from('task_assignment')
              .select(`
                id,
                task_id,
                assigned_by
              `)
              .in('task_id', taskIds);
            
            assignments = assignmentData || [];
            console.log('✅ Task assignments loaded successfully');
            
            // Fetch assignee profiles for task assignments
            if (assignments.length > 0) {
              const assigneeIds = [...new Set(assignments.map(a => a.assigned_by).filter(Boolean))];
              const { data: assignmentProfiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', assigneeIds);
              
              // Combine assignments with profiles
              assignments = assignments.map(assignment => ({
                ...assignment,
                assignee_profile: assignmentProfiles?.find(p => p.id === assignment.assigned_by)
              }));
            }
          } catch (assignmentError) {
            console.warn('⚠️ Task assignments table may not exist yet:', assignmentError);
            assignments = [];
          }
          
          // Combine the data
          data = data.map(task => {
            const taskAssignments = assignments?.filter(a => a.task_id === task.id) || [];
            console.log(`📊 Task ${task.title} assignments:`, taskAssignments);
            return {
              ...task,
              creator_profile: creatorProfiles?.find(p => p.id === task.created_by),
              assignee_profile: assigneeProfiles?.find(p => p.id === task.assignee_id),
              task_assignments: taskAssignments
            };
          });
          
          console.log('✅ Tasks and profiles combined successfully');
          
        } catch (profileError) {
          console.warn('⚠️ Profile loading failed, using tasks without profiles:', profileError);
          // Continue with tasks but without profile information
          data = data.map(task => ({
            ...task,
            creator_profile: null,
            assignee_profile: null,
            task_assignments: []
          }));
        }
      }

      if (tasksError) throw tasksError;

      console.log('📊 Setting tasks in state:', data?.map(t => ({ 
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
        // Get session token with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session timeout')), 2000);
        });
        
        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
        
        if (!session?.access_token) {
          throw new Error('No valid session found');
        }
        
        console.log('🔧 Making HTTP request to create task...');
        
        // Make HTTP request to create task
        const response = await fetch(`${(supabase as any).supabaseUrl}/rest/v1/family_tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': (supabase as any).supabaseKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(insertData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Task created successfully via HTTP API:', data);
        
      } catch (httpError: any) {
        console.warn('⚠️ HTTP API approach failed, trying Supabase client:', httpError);
        
        // Fallback to Supabase client with timeout
        try {
          const insertPromise = supabase
            .from('family_tasks')
            .insert([insertData])
            .select();

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database operation timed out after 3 seconds')), 3000);
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
    loadTasks();
  }, [currentFamily?.id, user?.id, loadTasks]);

 // Add user?.id to dependencies

  // Periodic refresh as fallback (every 5 minutes)
  useEffect(() => {
    if (!currentFamily) return;

    const interval = setInterval(() => {
      loadTasks();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [currentFamily?.id, loadTasks]);



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