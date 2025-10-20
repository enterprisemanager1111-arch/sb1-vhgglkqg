/**
 * Authentication Recovery Hook
 * Handles session recovery, timeouts, and improved error handling
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthRecoveryState {
  isRecovering: boolean;
  recoveryAttempts: number;
  lastRecoveryTime: string | null;
  sessionTimeout: boolean;
}

interface UseAuthRecoveryReturn {
  isRecovering: boolean;
  sessionTimeout: boolean;
  attemptSessionRecovery: () => Promise<boolean>;
  clearSessionTimeout: () => void;
  forceRefreshSession: () => Promise<void>;
}

const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_TIMEOUT = 30000; // 30 seconds
const SESSION_CHECK_INTERVAL = 300000; // 5 minutes

export const useAuthRecovery = (): UseAuthRecoveryReturn => {
  const { session, user } = useAuth();
  const [state, setState] = useState<AuthRecoveryState>({
    isRecovering: false,
    recoveryAttempts: 0,
    lastRecoveryTime: null,
    sessionTimeout: false,
  });

  // Automatic session health check
  useEffect(() => {
    if (!session || !user) return;

    const healthCheck = setInterval(async () => {
      try {
        // Ping Supabase to check if session is still valid
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          console.warn('Session health check failed:', error);
          setState(prev => ({ ...prev, sessionTimeout: true }));
        }
      } catch (error) {
        console.error('Session health check error:', error);
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(healthCheck);
  }, [session, user]);

  // Attempt to recover session
  const attemptSessionRecovery = useCallback(async (): Promise<boolean> => {
    if (state.isRecovering || state.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
      lastRecoveryTime: new Date().toISOString()
    }));

    try {
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session recovery failed:', error);
        return false;
      }

      if (data.session) {
        console.log('Session recovered successfully');
        setState(prev => ({ 
          ...prev, 
          isRecovering: false,
          sessionTimeout: false,
          recoveryAttempts: 0
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session recovery error:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [state.isRecovering, state.recoveryAttempts]);

  // Clear session timeout state
  const clearSessionTimeout = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      sessionTimeout: false, 
      recoveryAttempts: 0 
    }));
  }, []);

  // Force refresh session
  const forceRefreshSession = useCallback(async () => {
    try {
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error('Force refresh failed:', error);
      throw error;
    }
  }, []);

  // Reset recovery attempts after successful session
  useEffect(() => {
    if (session && user && state.recoveryAttempts > 0) {
      setState(prev => ({ ...prev, recoveryAttempts: 0 }));
    }
  }, [session, user, state.recoveryAttempts]);

  return {
    isRecovering: state.isRecovering,
    sessionTimeout: state.sessionTimeout,
    attemptSessionRecovery,
    clearSessionTimeout,
    forceRefreshSession,
  };
};