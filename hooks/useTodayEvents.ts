import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

export interface TodayEvent {
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

export const useTodayEvents = () => {
  const [events, setEvents] = useState<TodayEvent[]>([]);
  const [loading, setLoading] = useState(false); // Start as false, will be set to true when actually fetching
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentFamily, loading: familyLoading } = useFamily();
  const lastFetchRef = useRef<number>(0);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ useTodayEvents: Loading timeout reached, stopping loading');
        setLoading(false);
        setError('Loading timeout - please try again');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchTodayEvents = async () => {
    if (!user || !currentFamily) {
      console.log('⚠️ No user or family, skipping event fetch');
      setLoading(false);
      return;
    }

    // Debounce: Don't fetch if we've fetched recently (within 5 seconds)
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      console.log('⏳ useTodayEvents: Debouncing fetch request (too recent)');
      return;
    }
    lastFetchRef.current = now;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching today\'s events for family:', currentFamily.id);

      // First, check if calendar_events table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('❌ Calendar events table error:', tableError);
        if (tableError.message.includes('relation "calendar_events" does not exist')) {
          console.log('⚠️ Calendar events table does not exist');
          setError('Calendar events table not found. Please create some events first.');
          setEvents([]);
          setLoading(false);
          return;
        }
        setError(tableError.message);
        setLoading(false);
        return;
      }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('📅 Date range:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });

      // Simplified query - get all events for the family first
      const { data, error: fetchError } = await supabase
        .from('calendar_events')
        .select(`
          id,
          title,
          description,
          event_date,
          end_date,
          location,
          created_by,
          family_id
        `)
        .eq('family_id', currentFamily.id);

      if (fetchError) {
        console.error('❌ Error fetching events:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      console.log('✅ All events fetched:', data);

      // Filter events in JavaScript to find today's events
      const todayEvents = (data || []).filter(event => {
        const eventDate = new Date(event.event_date);
        const eventEndDate = event.end_date ? new Date(event.end_date) : eventDate;
        
        // Check if today falls between event_date and end_date
        const isToday = today >= eventDate && today <= eventEndDate;
        
        console.log(`📅 Event "${event.title}":`, {
          eventDate: eventDate.toISOString(),
          eventEndDate: eventEndDate.toISOString(),
          today: today.toISOString(),
          isToday
        });
        
        return isToday;
      });

      console.log('✅ Today\'s events filtered:', todayEvents);

      // Fetch assignees and their profiles for each event
      const eventsWithAssignees = await Promise.all(
        todayEvents.map(async (event) => {
          try {
            const { data: assignments } = await supabase
              .from('event_assignment')
              .select('user_id')
              .eq('event_id', event.id);

            const assigneeIds = assignments?.map(a => a.user_id) || [];
            
            // Fetch assignee profiles if we have assignees
            let assigneeProfiles = [];
            if (assigneeIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', assigneeIds);
              
              assigneeProfiles = profiles || [];
            }

            return {
              ...event,
              assignees: assigneeIds,
              assigneeProfiles
            };
          } catch (err) {
            console.warn('⚠️ Could not fetch assignees for event:', event.id, err);
            return {
              ...event,
              assignees: [],
              assigneeProfiles: []
            };
          }
        })
      );

      console.log('✅ Final events with assignees:', eventsWithAssignees);
      
      // Filter events to only show those assigned to the current user
      const userAssignedEvents = eventsWithAssignees.filter(event => {
        const isAssignedToUser = event.assignees && event.assignees.includes(user.id);
        console.log(`👤 Event "${event.title}" assigned to user:`, isAssignedToUser);
        return isAssignedToUser;
      });
      
      console.log('✅ User assigned events:', userAssignedEvents);
      setEvents(userAssignedEvents);
    } catch (err) {
      console.error('❌ Error in fetchTodayEvents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch if family is still loading
    if (familyLoading) {
      console.log('⏳ useTodayEvents: Family still loading, waiting...');
      setLoading(false);
      return;
    }

    // Only fetch if we have both user and family
    if (user && currentFamily) {
      console.log('🔄 useTodayEvents: User and family available, fetching events');
      fetchTodayEvents();
    } else {
      console.log('⏳ useTodayEvents: Waiting for user or family', { 
        hasUser: !!user, 
        hasFamily: !!currentFamily,
        familyLoading 
      });
      // Reset loading state if we don't have required data
      setLoading(false);
      setEvents([]);
    }
  }, [user?.id, currentFamily?.id, familyLoading]);

  const refreshEvents = () => {
    fetchTodayEvents();
  };

  return {
    events,
    loading,
    error,
    refreshEvents
  };
};
