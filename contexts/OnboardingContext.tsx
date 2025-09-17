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
        // Merge carefully to preserve existing data
        const mergedData = {
          ...defaultOnboardingData,
          ...parsedData,
          // Preserve personal info if it exists in stored data
          personalInfo: {
            ...defaultOnboardingData.personalInfo,
            ...parsedData.personalInfo
          },
          preferences: {
            ...defaultOnboardingData.preferences,
            ...parsedData.preferences
          },
          authInfo: {
            ...defaultOnboardingData.authInfo,
            ...parsedData.authInfo
          }
        };
        console.log('DEBUG: Loaded onboarding data from storage:', mergedData);
        setOnboardingData(mergedData);
      } else {
        console.log('DEBUG: No stored onboarding data found, using defaults');
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingData = async (newData: OnboardingData) => {
    try {
      console.log('DEBUG: Attempting to save to AsyncStorage...');
      const dataToSave = JSON.stringify(newData);
      console.log('DEBUG: Data to save (JSON):', dataToSave);
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, dataToSave);
      console.log('DEBUG: Successfully saved to AsyncStorage');
      
      setOnboardingData(newData);
      console.log('DEBUG: Successfully updated state');
    } catch (error: any) {
      console.error('ERROR: Failed to save onboarding data to AsyncStorage:', error);
      console.error('ERROR details:', error.message, error.stack);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  };

  const updatePersonalInfo = async (info: Partial<OnboardingData['personalInfo']>) => {
    console.log('DEBUG: updatePersonalInfo called with:', info);
    console.log('DEBUG: Current onboarding data before update:', onboardingData.personalInfo);
    
    try {
      // Get the current state (in case it's out of sync)
      const currentStoredData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      let currentData = onboardingData;
      
      if (currentStoredData) {
        currentData = JSON.parse(currentStoredData);
        console.log('DEBUG: Using stored data as base:', currentData.personalInfo);
      }
      
      // Merge the new info with existing data
      const updatedPersonalInfo = {
        ...currentData.personalInfo,
        ...info
      };
      
      const updatedData = {
        ...currentData,
        personalInfo: updatedPersonalInfo,
      };
      
      console.log('DEBUG: Personal info to be saved:', updatedPersonalInfo);
      console.log('DEBUG: Full updated data to save:', updatedData);
      
      // Save to AsyncStorage first
      const dataToSave = JSON.stringify(updatedData);
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, dataToSave);
      console.log('DEBUG: Successfully saved to AsyncStorage');
      
      // Update React state
      setOnboardingData(updatedData);
      console.log('DEBUG: Successfully updated React state');
      
      // Verify what was actually saved
      const savedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('DEBUG: Verified saved personal info in storage:', parsed.personalInfo);
      }
      
      console.log('DEBUG: Personal info successfully saved to local storage!');
    } catch (error) {
      console.error('ERROR: Failed to save personal info:', error);
      throw error;
    }
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