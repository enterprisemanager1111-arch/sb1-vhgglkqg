import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TodayTask {
  task_id: string;
  family_id: string;
  title: string;
  description?: string;
  category: string;
  points: number;
  due_date?: string;
  start_date: string;
  end_date: string;
  completed: boolean;
  created_by: string;
  created_at: string;
  assignees?: Array<{
    user_id: string;
    name: string;
    avatar_url?: string;
  }>;
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
      console.log('⚠️ fetchTodayTasks: No user ID, skipping fetch');
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching today\'s tasks for user:', user.id);
      
      // Call the get_today_tasks_with_detail RPC function
      const { data: tasksData, error: rpcError } = await supabase
        .rpc('get_today_tasks_with_detail', {
          _user_id: user.id
        });

      if (rpcError) {
        console.error('❌ Error fetching today\'s tasks:', rpcError);
        setError(rpcError.message);
        setTasks([]);
        return;
      }

      console.log('📋 Today\'s tasks fetched:', tasksData);
      console.log('📋 Tasks count:', tasksData?.length || 0);
      
      // Debug task details
      if (tasksData && tasksData.length > 0) {
        tasksData.forEach((task: TodayTask, index: number) => {
          console.log(`📋 Task ${index + 1} (${task.title}):`, {
            completed: task.completed,
            category: task.category,
            points: task.points,
            due_date: task.due_date,
            assignees: task.assignees
          });
        });
      } else {
        console.log('📋 No tasks found for today');
        console.log('📋 User ID:', user.id);
        console.log('📋 Current date:', new Date().toISOString().split('T')[0]);
      }

      setTasks(tasksData || []);
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

  // Initial fetch
  useEffect(() => {
    fetchTodayTasks();
  }, [fetchTodayTasks]);

  // Real-time subscription for family_tasks and task_assignment
  useEffect(() => {
    console.log('🔄 Real-time useEffect triggered');
    console.log('🔄 User ID:', user?.id);
    
    if (!user?.id) {
      console.log('⚠️ No user ID, skipping real-time subscription');
      return;
    }

    console.log('🔄 Setting up real-time subscription for today\'s tasks, user:', user.id);

    // Create a handler that refetches tasks (without loading state to avoid UI flicker)
    const handleTaskChange = async () => {
      console.log('🔄 Refetching tasks due to real-time change...');
      try {
        const { data: tasksData, error: rpcError } = await supabase
          .rpc('get_today_tasks_with_detail', {
            _user_id: user.id
          });

        if (rpcError) {
          console.error('❌ Error refetching today\'s tasks:', rpcError);
          return;
        }

        console.log('✅ Tasks refetched successfully:', tasksData?.length || 0);
        setTasks(tasksData || []);
        setError(null);
      } catch (err) {
        console.error('❌ Error in real-time refetch:', err);
      }
    };

    // Create unique channel name per user to avoid conflicts
    const channelName = `today-tasks-${user.id}`;
    console.log('📡 Creating channel:', channelName);

    // Subscribe to changes in family_tasks and task_assignment tables
    console.log('📡 About to call supabase.channel()...');
    const tasksChannel = supabase.channel(channelName);
    console.log('📡 Channel created:', tasksChannel);
    
    console.log('📡 Setting up postgres_changes listener for family_tasks...');
    tasksChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'family_tasks'
      },
      (payload) => {
        console.log('🔄 Family tasks change detected:', payload.eventType, payload);
        handleTaskChange();
      }
    );
    
    console.log('📡 Setting up postgres_changes listener for task_assignment...');
    tasksChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_assignment'
      },
      (payload) => {
        console.log('🔄 Task assignment change detected:', payload.eventType, payload);
        handleTaskChange();
      }
    );
    
    console.log('📡 About to subscribe to channel...');
    tasksChannel.subscribe((status, err) => {
      console.log('🔄 Real-time subscription callback triggered');
      console.log('🔄 Status:', status);
      console.log('🔄 Error:', err);
      
      if (err) {
        console.error('❌ Subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to real-time updates for channel:', channelName);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - real-time might not be enabled in Supabase');
      }
      if (status === 'TIMED_OUT') {
        console.error('❌ Subscription timed out');
      }
      if (status === 'CLOSED') {
        console.log('🔄 Channel closed');
      }
    });
    
    console.log('📡 Subscribe call completed');

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 Cleaning up real-time subscription:', channelName);
      tasksChannel.unsubscribe();
      console.log('🔄 Unsubscribe completed');
    };
  }, [user?.id]);
  
  console.log('🔄 useTodayTasks hook rendered, user:', user?.id, 'tasks count:', tasks.length);

  return {
    tasks,
    loading,
    error,
    refreshTasks
  };
};
