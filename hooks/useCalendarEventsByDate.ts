import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  created_by: string;
  family_id: string;
  assignees?: string[];
  assigneeProfiles?: {
    id: string;
    name: string;
    avatar_url?: string;
  }[];
}

export const useCalendarEventsByDate = (selectedDate: Date | null) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const isLoadingRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEventsForDate = useCallback(async (date: Date) => {
    if (!user || !date) {
      console.log('⚠️ No user or date, skipping event fetch');
      setEvents([]);
      setLoading(false);
      setIsFetching(false);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isLoadingRef.current) {
      console.log('⚠️ Already fetching events, skipping duplicate request');
      return;
    }

    try {
      console.log('🚀 Starting event fetch for date:', date.toISOString().split('T')[0]);
      isLoadingRef.current = true;
      setIsFetching(true);
      setLoading(true);
      setError(null);

      // Set a timeout to prevent hanging loading state
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Loading timeout - force resetting loading state');
        setLoading(false);
        setIsFetching(false);
        isLoadingRef.current = false;
      }, 3000); // 3 second timeout
      
      // Show loading immediately
      console.log('⏳ Loading state set to true');

      // Try get_events_by_date function first
      console.log('🔧 Trying get_events_by_date function...');
      let data, fetchError;
      
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_events_by_date', {
            _user_id: user.id,
            _selected_date: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
          });
        
        data = functionData;
        fetchError = functionError;
        
        if (fetchError) {
          console.log('⚠️ Function failed, trying fallback query...');
          throw fetchError;
        }
        
        console.log('✅ Function succeeded');
      } catch (functionErr) {
        console.log('🔄 Function failed, trying direct table query...');
        
        // Fallback to direct table query
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('calendar_events')
            .select(`
              id,
              title,
              description,
              event_date,
              end_date,
              location,
              created_by,
              family_id,
              created_at,
              updated_at
            `)
            .gte('event_date', date.toISOString().split('T')[0])
            .lt('event_date', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('event_date', { ascending: true });
          
          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError);
            throw fallbackError;
          }
          
          console.log('✅ Fallback query succeeded');
          data = fallbackData;
          fetchError = null;
        } catch (fallbackErr) {
          console.error('❌ Both function and fallback failed:', fallbackErr);
          throw fallbackErr;
        }
      }

      if (fetchError) {
        console.error('❌ Error fetching events:', fetchError);
        setError(fetchError.message);
        setEvents([]);
        setLoading(false);
        setIsFetching(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('📅 Events fetched successfully:', data?.length || 0);
      console.log('📅 Sample event data:', data?.[0]);

      // Process events from function response
      const processedEvents: CalendarEvent[] = [];
      
      if (data && data.length > 0) {
        data.forEach(event => {
          const calendarEvent: CalendarEvent = {
            id: event.id,
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            end_date: event.end_date,
            location: event.location,
            created_by: event.created_by,
            family_id: event.family_id,
            assignees: event.assignees?.map((a: any) => a.user_id) || [],
            assigneeProfiles: event.assignees?.map((a: any) => ({
              id: a.user_id,
              name: a.name,
              avatar_url: a.avatar
            })) || []
          };

          processedEvents.push(calendarEvent);
        });
      }

      console.log('📅 Total events for selected date:', processedEvents.length);
      setEvents(processedEvents);
      setError(null);
    } catch (error: any) {
      console.error('❌ Error in fetchEventsForDate:', error);
      setError(error.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      console.log('✅ Event fetch completed, setting loading to false');
      setLoading(false);
      setIsFetching(false);
      isLoadingRef.current = false;
      
      // Clear the timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [user]);

  // Fetch events when selected date changes
  useEffect(() => {
    if (selectedDate) {
      console.log('🔄 Selected date changed, fetching events for:', selectedDate.toISOString().split('T')[0]);
      fetchEventsForDate(selectedDate);
    } else {
      console.log('🔄 No selected date, clearing events');
      setEvents([]);
      setLoading(false);
      setError(null);
    }
  }, [selectedDate, fetchEventsForDate]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const refreshEvents = useCallback(async () => {
    if (selectedDate) {
      console.log('🔄 Manual refresh requested for date:', selectedDate.toISOString().split('T')[0]);
      await fetchEventsForDate(selectedDate);
    }
  }, [selectedDate, fetchEventsForDate]);

  return {
    events,
    loading,
    error,
    refreshEvents
  };
};
