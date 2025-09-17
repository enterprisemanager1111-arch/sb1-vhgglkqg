import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout, withRetry } from '@/utils/loadingOptimization';
import { PointsService } from '@/services/pointsService';

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  created_by: string;
  attendees: string[];
  created_at: string;
  updated_at: string;
  creator_profile?: {
    name: string;
    avatar_url?: string;
  };
}

interface UseFamilyCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
  getEventsForDate: (date: string) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];
}

export const useFamilyCalendarEvents = (): UseFamilyCalendarEventsReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentFamily } = useFamily();

  // Load events from database
  const loadEvents = useCallback(async () => {
    if (!currentFamily || !user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: eventsError } = await withTimeout(
        supabase
          .from('calendar_events')
          .select(`
            *,
            creator_profile:profiles!created_by (
              name,
              avatar_url
            )
          `)
          .eq('family_id', currentFamily.id)
          .order('event_date', { ascending: true }),
        5000,
        'Failed to load calendar events'
      );

      if (eventsError) throw eventsError;

      setEvents(data || []);
    } catch (error: any) {
      console.error('Error loading calendar events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentFamily, user]);

  // Create new event
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!currentFamily || !user) {
      throw new Error('User must be in a family to create events');
    }

    try {
      const { error } = await withRetry(
        () => supabase
          .from('calendar_events')
          .insert([{
            ...eventData,
            family_id: currentFamily.id,
            created_by: user.id,
          }]),
        3,
        1000
      );

      if (error) throw error;

      // Award points for creating an event
      if (currentFamily && user) {
        try {
          await PointsService.awardEventCreation(
            currentFamily.id,
            user.id,
            eventData.title,
            eventData.event_date
          );
        } catch (pointsError) {
          console.error('Error awarding points for event creation:', pointsError);
        }
      }
      // Refresh events list
      await loadEvents();
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }, [currentFamily, user, loadEvents]);

  // Update event
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh events list
      await loadEvents();
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }, [currentFamily, loadEvents]);

  // Delete event
  const deleteEvent = useCallback(async (id: string) => {
    if (!currentFamily) {
      throw new Error('No active family');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('family_id', currentFamily.id);

      if (error) throw error;

      // Refresh events list
      await loadEvents();
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }, [currentFamily, loadEvents]);

  // Refresh events
  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  // Filter functions
  const getEventsForDate = useCallback((date: string) => {
    const targetDate = new Date(date).toDateString();
    return events.filter(event => {
      const eventDate = new Date(event.event_date).toDateString();
      return eventDate === targetDate;
    });
  }, [events]);

  const getEventsForMonth = useCallback((year: number, month: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }, [events]);

  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= now && eventDate <= futureDate;
    });
  }, [events]);

  // Load events on mount and family change
  useEffect(() => {
    loadEvents();
  }, [currentFamily?.id, user?.id]); // Use stable dependencies instead of loadEvents

  // Setup real-time subscription with debouncing
  useEffect(() => {
    if (!currentFamily) return;

    console.log('Setting up real-time subscription for calendar events:', currentFamily.id);

    let debounceTimeout: NodeJS.Timeout;

    const debouncedLoadEvents = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadEvents();
      }, 500); // 500ms debounce
    };

    const channel = supabase
      .channel(`calendar_events_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        (payload) => {
          console.log('Real-time calendar event change:', payload);
          debouncedLoadEvents();
        }
      )
      .subscribe((status) => {
        console.log('Calendar events subscription status:', status);
      });

    return () => {
      console.log('Cleaning up calendar events subscription');
      clearTimeout(debounceTimeout);
      channel.unsubscribe();
    };
  }, [currentFamily?.id]); // Remove loadEvents dependency

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
  };
};