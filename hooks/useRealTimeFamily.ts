/**
 * Real-Time Family Management Hook
 * Implementiert Live-Updates für Familienmitglieder und Aktivitäten
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
}

interface RealTimeFamilyState {
  members: FamilyMember[];
  onlineMembers: Set<string>;
  recentActivity: FamilyActivity[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

interface FamilyActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'task_completed' | 'event_created';
  user_id: string;
  family_id: string;
  details: any;
  created_at: string;
  user_name: string;
}

export const useRealTimeFamily = (familyId: string | null) => {
  const { user } = useAuth();
  const [state, setState] = useState<RealTimeFamilyState>({
    members: [],
    onlineMembers: new Set(),
    recentActivity: [],
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial family data
  const loadInitialData = useCallback(async () => {
    if (!familyId || !user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load family members with profiles
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select(`
          *,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('family_id', familyId);

      if (membersError) throw membersError;

      setState(prev => ({
        ...prev,
        members: members || [],
        loading: false,
        lastUpdate: new Date().toISOString(),
      }));

    } catch (error: any) {
      console.error('Error loading family data:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [familyId, user]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!familyId || !user) {
      return;
    }

    // Create Supabase real-time channel
    const channel = supabase.channel(`family_${familyId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user.id },
      },
    });

    // Subscribe to family_members table changes
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_members',
        filter: `family_id=eq.${familyId}`,
      }, (payload) => {
        console.log('Family member change:', payload);
        
        // Reload data on any member changes
        loadInitialData();
        
        // Add to recent activity
        if (payload.eventType === 'INSERT' && payload.new) {
          const newActivity: FamilyActivity = {
            id: `activity_${Date.now()}`,
            type: 'member_joined',
            user_id: payload.new.user_id,
            family_id: familyId,
            details: payload.new,
            created_at: new Date().toISOString(),
            user_name: 'Neues Mitglied',
          };
          
          setState(prev => ({
            ...prev,
            recentActivity: [newActivity, ...prev.recentActivity.slice(0, 9)],
          }));
        }
      })
      
      // Subscribe to presence (online status)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('🔍 Presence sync - newState:', newState);
        const onlineUsers = new Set(Object.keys(newState));
        console.log('🔍 Presence sync - onlineUsers:', Array.from(onlineUsers));
        
        setState(prev => ({
          ...prev,
          onlineMembers: onlineUsers,
        }));
      })
      
      // Handle new joins
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setState(prev => ({
          ...prev,
          onlineMembers: new Set([...prev.onlineMembers, key]),
        }));
      })
      
      // Handle leaves
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setState(prev => {
          const newOnlineMembers = new Set(prev.onlineMembers);
          newOnlineMembers.delete(key);
          return {
            ...prev,
            onlineMembers: newOnlineMembers,
          };
        });
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      console.log('🔍 Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('🔍 Tracking presence for user:', user.id);
        // Track user presence
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
        console.log('🔍 Presence tracked successfully');
      }
    });

    channelRef.current = channel;

    // Setup heartbeat to maintain connection
    heartbeatRef.current = setInterval(() => {
      if (channel.state === 'joined') {
        channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds

    // Load initial data
    loadInitialData();

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [familyId, user, loadInitialData]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    const isOnline = state.onlineMembers.has(userId);
    console.log(`🔍 Checking if user ${userId} is online:`, isOnline, 'Online members:', Array.from(state.onlineMembers));
    return isOnline;
  }, [state.onlineMembers]);

  return {
    ...state,
    refreshData,
    isUserOnline,
    totalMembers: state.members.length,
    adminMembers: state.members.filter(m => m.role === 'admin').length,
    regularMembers: state.members.filter(m => m.role === 'member').length,
  };
};