import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentUserEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  created_by: string;
  family_id: string;
  assignee_count: number;
  creator_profile?: {
    name: string;
    avatar_url?: string;
  };
  assignees: {
    user_id: string;
    name: string;
    avatar?: string;
  }[];
}

interface UseCurrentUserEventsReturn {
  events: CurrentUserEvent[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

export const useCurrentUserEvents = (): UseCurrentUserEventsReturn => {
  const [events, setEvents] = useState<CurrentUserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  const fetchCurrentUserEvents = useCallback(async () => {
    if (!user?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching current user events for user:', user.id);
      
      // Call the get_current_user_events RPC function
      const { data: events, error } = await supabase
        .rpc('get_current_user_events', {
          _user_id: user.id
        });

      if (error) {
        console.error('❌ Error fetching current user events:', error);
        setError(error.message);
        setEvents([]);
        return;
      }

      console.log('📅 Current user events fetched:', events);
      console.log('📅 Events count:', events?.length || 0);
      
      // Debug assignees
      if (events && events.length > 0) {
        events.forEach((event, index) => {
          console.log(`📅 Event ${index + 1} (${event.title}):`, {
            assignee_count: event.assignee_count,
            assignees: event.assignees,
            assignees_length: event.assignees?.length || 0
          });
        });
      }

      setEvents(events || []);
      setError(null);
    } catch (err) {
      console.error('Current user events fetch error:', err);
      setError('Failed to load current user events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshEvents = useCallback(async () => {
    await fetchCurrentUserEvents();
  }, [fetchCurrentUserEvents]);

  useEffect(() => {
    fetchCurrentUserEvents();
  }, [fetchCurrentUserEvents]);

  return {
    events,
    loading,
    error,
    refreshEvents
  };
};
