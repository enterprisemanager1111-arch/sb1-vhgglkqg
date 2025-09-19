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
  getOnboardingSteps: (t?: (key: string) => string) => OnboardingStep[];
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
    title: 'family-setup-title', // Translation key
    description: 'family-setup-description', // Translation key
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
      console.log('DEBUG: saveOnboardingData called with newData:', newData);
      console.log('DEBUG: newData.personalInfo:', newData?.personalInfo);
      console.log('DEBUG: Attempting to save to AsyncStorage...');
      
      // Check if newData is valid
      if (!newData || typeof newData !== 'object') {
        console.error('ERROR: newData is invalid:', newData);
        throw new Error('Invalid data structure provided to saveOnboardingData');
      }
      
      const dataToSave = JSON.stringify(newData);
      console.log('DEBUG: Data to save (JSON):', dataToSave);
      console.log('DEBUG: JSON length:', dataToSave.length);
      
      if (dataToSave === '{}' || dataToSave.length < 10) {
        console.error('ERROR: Data appears to be empty or invalid');
        console.error('ERROR: Original newData object:', newData);
        throw new Error('Attempted to save empty or invalid data');
      }
      
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, dataToSave);
      console.log('DEBUG: Successfully saved to AsyncStorage');
      
      // Verify the save
      const savedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      console.log('DEBUG: Verification - data actually saved:', savedData);
      
      setOnboardingData(newData);
      console.log('DEBUG: Successfully updated state');
    } catch (error: any) {
      console.error('ERROR: Failed to save onboarding data to AsyncStorage:', error);
      console.error('ERROR details:', error.message, error.stack);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  };

  const updatePersonalInfo = async (info: Partial<OnboardingData['personalInfo']>) => {
    console.log('=== DEBUG: updatePersonalInfo called ===');
    console.log('DEBUG: Info parameter:', info);
    console.log('DEBUG: Loading state:', loading);
    console.log('DEBUG: Current onboarding data state:', onboardingData);
    console.log('DEBUG: Current personal info before update:', onboardingData.personalInfo);
    console.log('DEBUG: Is onboardingData valid?', !!onboardingData);
    console.log('DEBUG: Is personalInfo object valid?', !!onboardingData.personalInfo);
    
    // Wait for loading to complete if still loading
    if (loading) {
      console.log('DEBUG: Context still loading, waiting...');
      // Wait a bit for loading to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Use current context state as base data
    const updatedData = {
      ...onboardingData,
      personalInfo: { ...onboardingData.personalInfo, ...info },
    };
    
    console.log('DEBUG: Personal info to be saved:', updatedData.personalInfo);
    console.log('DEBUG: Full updated data to save:', updatedData);
    console.log('DEBUG: JSON.stringify of data to save:', JSON.stringify(updatedData));
    
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
    console.log('DEBUG: completeStep called with stepId:', stepId, 'details:', details);
    
    const now = new Date().toISOString();
    
    // Get fresh data from AsyncStorage to avoid stale state
    let currentData = onboardingData;
    try {
      const storedData = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        currentData = {
          ...defaultOnboardingData,
          ...parsedData,
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
        console.log('DEBUG: completeStep using fresh data from storage:', currentData);
      } else {
        console.log('DEBUG: completeStep no stored data, using context data');
      }
    } catch (error) {
      console.log('DEBUG: completeStep error reading storage, using context data:', error);
    }
    
    const updatedSteps = [...currentData.completedSteps];
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
      ...currentData,
      completedSteps: updatedSteps,
      currentStepIndex: Math.max(currentData.currentStepIndex, updatedSteps.length)
    };
    
    console.log('DEBUG: completeStep saving data with personalInfo:', updatedData.personalInfo);
    await saveOnboardingData(updatedData);
  };

  const getOnboardingSteps = (t?: (key: string) => string): OnboardingStep[] => {
    return ONBOARDING_STEPS.map(stepTemplate => {
      const completedStep = onboardingData.completedSteps.find(s => s.id === stepTemplate.id);
      
      // Translate the step if translation function is provided
      const translatedStep = t ? {
        ...stepTemplate,
        title: t(stepTemplate.title) || stepTemplate.title,
        description: t(stepTemplate.description) || stepTemplate.description
      } : stepTemplate;
      
      if (completedStep) {
        return {
          ...completedStep,
          title: t ? (t(stepTemplate.title) || stepTemplate.title) : completedStep.title,
          description: t ? (t(stepTemplate.description) || stepTemplate.description) : completedStep.description
        };
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
        ...translatedStep,
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