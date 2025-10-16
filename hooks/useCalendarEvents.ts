import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';

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

export const useCalendarEvents = (selectedDate: Date | null) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentFamily, loading: familyLoading } = useFamily();
  const [isFetching, setIsFetching] = useState(false);

  // Remove timeout mechanism - rely on proper loading state management

  const fetchEventsForDate = async (date: Date) => {
    if (!user || !date) {
      console.log('⚠️ No user or date, skipping event fetch');
      setEvents([]);
      setLoading(false);
      setIsFetching(false);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetching) {
      console.log('⚠️ Already fetching events, skipping duplicate request');
      return;
    }

    // If already loading, don't start another fetch
    if (loading) {
      console.log('⚠️ Already loading, skipping duplicate request');
      return;
    }

    try {
      console.log('🚀 Starting event fetch, setting loading to true');
      setIsFetching(true);
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching events for dates:', dates.map(d => d.toISOString().split('T')[0]));

      // Get date range for all selected dates
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Set to start and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('📅 Date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Check if calendar_events table exists
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

      // Fetch events for the date range
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
        .eq('family_id', currentFamily.id)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString());

      if (fetchError) {
        console.error('❌ Error fetching events:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Events fetched:', data);

      // Filter events to only include those that fall on the selected dates
      const selectedDateStrings = dates.map(d => d.toISOString().split('T')[0]);
      const filteredEvents = (data || []).filter(event => {
        const eventDate = new Date(event.event_date);
        const eventDateString = eventDate.toISOString().split('T')[0];
        return selectedDateStrings.includes(eventDateString);
      });

      console.log('✅ Filtered events for selected dates:', filteredEvents);

      // Fetch assignees and their profiles for each event
      const eventsWithAssignees = await Promise.all(
        filteredEvents.map(async (event) => {
          try {
            console.log('🔍 Fetching assignees for event:', event.id);
            const { data: assignments, error: assignmentError } = await supabase
              .from('event_assignment')
              .select('user_id')
              .eq('event_id', event.id);

            if (assignmentError) {
              console.warn('⚠️ Error fetching assignees for event:', event.id, assignmentError);
              return {
                ...event,
                assignees: [],
                assigneeProfiles: []
              };
            }

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

            console.log('✅ Assignees fetched for event:', event.id, assignments);
            return {
              ...event,
              assignees: assigneeIds,
              assigneeProfiles
            };
          } catch (err) {
            console.warn('⚠️ Exception fetching assignees for event:', event.id, err);
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
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('❌ Error in fetchEventsForDates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]); // Clear events on error
    } finally {
      console.log('🏁 fetchEventsForDates completed, setting loading to false');
      setLoading(false);
      setIsFetching(false);
      console.log('✅ Loading state reset to false');
    }
  };

  // Create a stable string representation of selectedDates to prevent unnecessary re-fetches
  const selectedDatesString = useMemo(() => {
    return selectedDates.map(date => date.toISOString().split('T')[0]).join(',');
  }, [selectedDates]);

  // Track previous values to prevent unnecessary re-fetches
  const prevUserRef = useRef(user?.id);
  const prevFamilyRef = useRef(currentFamily?.id);
  const prevDatesRef = useRef(selectedDatesString);

  useEffect(() => {
    console.log('🔄 useCalendarEvents: useEffect triggered', {
      hasUser: !!user,
      hasFamily: !!currentFamily,
      familyLoading,
      selectedDatesCount: selectedDates.length,
      selectedDatesString,
      currentLoading: loading,
      userChanged: prevUserRef.current !== user?.id,
      familyChanged: prevFamilyRef.current !== currentFamily?.id,
      datesChanged: prevDatesRef.current !== selectedDatesString
    });

    // Don't fetch if family is still loading
    if (familyLoading) {
      console.log('⏳ useCalendarEvents: Family still loading, waiting...');
      setLoading(false);
      return;
    }

    // Only fetch if we have user, family, and dates
    if (user && currentFamily && selectedDates.length > 0) {
      // Check if this is a meaningful change (not just token refresh)
      const userChanged = prevUserRef.current !== user.id;
      const familyChanged = prevFamilyRef.current !== currentFamily.id;
      const datesChanged = prevDatesRef.current !== selectedDatesString;
      
      if (userChanged || familyChanged || datesChanged) {
        console.log('🔄 useCalendarEvents: Meaningful change detected, fetching events', {
          userChanged,
          familyChanged,
          datesChanged
        });
        fetchEventsForDates(selectedDates);
        
        // Update refs
        prevUserRef.current = user.id;
        prevFamilyRef.current = currentFamily.id;
        prevDatesRef.current = selectedDatesString;
      } else {
        console.log('⏹️ useCalendarEvents: No meaningful change detected, skipping fetch');
      }
    } else {
      console.log('⏳ useCalendarEvents: Waiting for user, family, or dates', { 
        hasUser: !!user, 
        hasFamily: !!currentFamily,
        datesCount: selectedDates.length,
        familyLoading 
      });
      setLoading(false);
      setEvents([]);
    }
  }, [user, currentFamily, familyLoading, selectedDatesString]); // Use selectedDatesString instead of selectedDates

  const refreshEvents = () => {
    if (selectedDates.length > 0) {
      fetchEventsForDates(selectedDates);
    }
  };

  // Cleanup function to reset states
  const resetStates = () => {
    setLoading(false);
    setIsFetching(false);
    setError(null);
  };

  return {
    events,
    loading,
    error,
    refreshEvents,
    resetStates
  };
};
