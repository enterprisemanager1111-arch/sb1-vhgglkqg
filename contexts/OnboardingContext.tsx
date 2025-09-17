import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStep } from '@/components/OnboardingOverview';

interface OnboardingData {
  personalInfo: {
    name: string;
    birthDate: string;
    role: string;
    interests: string[];
  };
  preferences: {
    goals: string[];
  };
  authInfo: {
    email: string;
    password: string;
  };
  completedSteps: OnboardingStep[];
  currentStepIndex: number;
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updatePersonalInfo: (info: Partial<OnboardingData['personalInfo']>) => Promise<void>;
  updatePreferences: (prefs: Partial<OnboardingData['preferences']>) => Promise<void>;
  updateAuthInfo: (auth: Partial<OnboardingData['authInfo']>) => Promise<void>;
  clearOnboardingData: () => Promise<void>;
  completeStep: (stepId: string, details?: Record<string, any>) => Promise<void>;
  getOnboardingSteps: () => OnboardingStep[];
  getCompletionPercentage: () => number;
  loading: boolean;
}

const ONBOARDING_STORAGE_KEY = '@famora_onboarding_data';

const defaultOnboardingData: OnboardingData = {
  personalInfo: {
    name: '',
    birthDate: '',
    role: '',
    interests: [],
  },
  preferences: {
    goals: [],
  },
  authInfo: {
    email: '',
    password: '',
  },
  completedSteps: [],
  currentStepIndex: 0,
};

// Define the onboarding steps structure
const ONBOARDING_STEPS: Omit<OnboardingStep, 'status' | 'completedAt' | 'details'>[] = [
  {
    id: 'language-selection',
    title: 'Sprache auswählen',
    description: 'Bevorzugte App-Sprache festlegen',
    category: 'preferences',
    icon: 'globe'
  },
  {
    id: 'personal-info',
    title: 'Persönliche Informationen',
    description: 'Name, Geburtsdatum und Rolle in der Familie',
    category: 'profile',
    icon: 'user'
  },
  {
    id: 'preferences',
    title: 'Präferenzen & Ziele',
    description: 'Ihre Ziele und Wünsche für die Familienorganisation',
    category: 'preferences',
    icon: 'target'
  },
  {
    id: 'authentication',
    title: 'Konto erstellen',
    description: 'E-Mail-Adresse und Passwort festlegen',
    category: 'authentication',
    icon: 'mail'
  },
  {
    id: 'profile-picture',
    title: 'Profilbild',
    description: 'Optionales Profilbild hinzufügen',
    category: 'profile',
    icon: 'camera'
  },
  {
    id: 'family-setup',
    title: 'Familie einrichten',
    description: 'Familie erstellen oder einer bestehenden beitreten',
    category: 'family',
    icon: 'users'
  }
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);
  const [loading, setLoading] = useState(true);

  // Load onboarding data from storage on mount
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setOnboardingData({ ...defaultOnboardingData, ...parsedData });
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingData = async (newData: OnboardingData) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newData));
      setOnboardingData(newData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  };

  const updatePersonalInfo = async (info: Partial<OnboardingData['personalInfo']>) => {
    const updatedData = {
      ...onboardingData,
      personalInfo: { ...onboardingData.personalInfo, ...info },
    };
    await saveOnboardingData(updatedData);
  };

  const updatePreferences = async (prefs: Partial<OnboardingData['preferences']>) => {
    const updatedData = {
      ...onboardingData,
      preferences: { ...onboardingData.preferences, ...prefs },
    };
    await saveOnboardingData(updatedData);
  };

  const updateAuthInfo = async (auth: Partial<OnboardingData['authInfo']>) => {
    const updatedData = {
      ...onboardingData,
      authInfo: { ...onboardingData.authInfo, ...auth },
    };
    await saveOnboardingData(updatedData);
  };

  const completeStep = async (stepId: string, details?: Record<string, any>) => {
    const now = new Date().toISOString();
    
    const updatedSteps = [...onboardingData.completedSteps];
    const existingStepIndex = updatedSteps.findIndex(step => step.id === stepId);
    
    const stepTemplate = ONBOARDING_STEPS.find(s => s.id === stepId);
    if (!stepTemplate) return;

    const completedStep: OnboardingStep = {
      ...stepTemplate,
      status: 'completed',
      completedAt: now,
      details: details || {},
      icon: stepTemplate.icon as any // Type assertion for icon
    };

    if (existingStepIndex >= 0) {
      updatedSteps[existingStepIndex] = completedStep;
    } else {
      updatedSteps.push(completedStep);
    }

    const updatedData = {
      ...onboardingData,
      completedSteps: updatedSteps,
      currentStepIndex: Math.max(onboardingData.currentStepIndex, updatedSteps.length)
    };
    
    await saveOnboardingData(updatedData);
  };

  const getOnboardingSteps = (): OnboardingStep[] => {
    return ONBOARDING_STEPS.map(stepTemplate => {
      const completedStep = onboardingData.completedSteps.find(s => s.id === stepTemplate.id);
      
      if (completedStep) {
        return completedStep;
      }
      
      // Determine status based on current progress
      const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === stepTemplate.id);
      let status: OnboardingStep['status'] = 'pending';
      
      if (stepIndex < onboardingData.currentStepIndex) {
        status = 'skipped'; // Was skipped
      } else if (stepIndex === onboardingData.currentStepIndex) {
        status = 'in-progress'; // Currently active
      }
      
      return {
        ...stepTemplate,
        status,
        icon: stepTemplate.icon as any
      };
    });
  };

  const getCompletionPercentage = useCallback((): number => {
    const completedCount = onboardingData.completedSteps.length;
    const totalCount = ONBOARDING_STEPS.length;
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }, [onboardingData.completedSteps]);

  const clearOnboardingData = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setOnboardingData(defaultOnboardingData);
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updatePersonalInfo,
        updatePreferences,
        updateAuthInfo,
        completeStep,
        getOnboardingSteps,
        getCompletionPercentage,
        clearOnboardingData,
        loading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};