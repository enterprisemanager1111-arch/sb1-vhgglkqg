import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { withTimeout, measurePerformance } from '@/utils/loadingOptimization';

interface AppInitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  shouldShowOnboarding: boolean;
  shouldShowFamilySetup: boolean;
  shouldShowMainApp: boolean;
}

export const useAppInitialization = (): AppInitializationState => {
  const [state, setState] = useState<AppInitializationState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    shouldShowOnboarding: false,
    shouldShowFamilySetup: false,
    shouldShowMainApp: false,
  });

  const { session, user, loading: authLoading } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Wait for auth and family data with timeout
        await measurePerformance(async () => {
          await withTimeout(
            new Promise<void>((resolve) => {
              if (!authLoading && !familyLoading) {
                resolve();
              } else {
                const checkInterval = setInterval(() => {
                  if (!authLoading && !familyLoading) {
                    clearInterval(checkInterval);
                    resolve();
                  }
                }, 100);
              }
            }),
            8000, // 8 second timeout
            'App initialization timeout'
          );
        }, 'App initialization');

        // Determine which screen to show
        let shouldShowOnboarding = false;
        let shouldShowFamilySetup = false;
        let shouldShowMainApp = false;

        if (!session || !user) {
          shouldShowOnboarding = true;
        } else if (!isInFamily) {
          shouldShowFamilySetup = true;
        } else {
          shouldShowMainApp = true;
        }

        setState({
          isInitialized: true,
          isLoading: false,
          error: null,
          shouldShowOnboarding,
          shouldShowFamilySetup,
          shouldShowMainApp,
        });

      } catch (error) {
        console.error('App initialization failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          // Default to onboarding on error
          shouldShowOnboarding: true,
          shouldShowFamilySetup: false,
          shouldShowMainApp: false,
        }));
      }
    };

    initializeApp();
  }, [session, user, isInFamily, authLoading, familyLoading]);

  return state;
};