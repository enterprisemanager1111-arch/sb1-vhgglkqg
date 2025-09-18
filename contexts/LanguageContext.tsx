import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import deTranslations from '@/locales/de.json';
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';
import esTranslations from '@/locales/es.json';
import itTranslations from '@/locales/it.json';
import nlTranslations from '@/locales/nl.json';

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export const supportedLanguages: Language[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', nativeName: 'Nederlands' },
];

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  loading: boolean;
  clearLanguagePreference: () => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = '@famora_selected_language';

// Translation mapping
const translations = {
  de: deTranslations,
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  it: itTranslations,
  nl: nlTranslations,
};


const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get translation from object
const getTranslationFromObject = (translations: any, key: string, params?: Record<string, string>): string | null => {
  try {
    const keys = key.split('.');
    let translation: any = translations;
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        return null;
      }
    }
    
    if (typeof translation === 'string') {
      // Replace parameters if provided
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{{${paramKey}}}`, paramValue);
        });
      }
      return translation;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting translation from object:', error);
    return null;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(supportedLanguages[1]); // Default to English
  const [loading, setLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguageCode = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguageCode) {
        const language = supportedLanguages.find(lang => lang.code === savedLanguageCode);
        if (language) {
          console.log('Loaded saved language:', language.name);
          setCurrentLanguage(language);
        } else {
          console.log('Invalid saved language code, defaulting to English');
          setCurrentLanguage(supportedLanguages[1]); // English
        }
      } else {
        console.log('No saved language preference, defaulting to English');
      setCurrentLanguage(supportedLanguages[1]); // English
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      setCurrentLanguage(supportedLanguages[1]); // English as fallback
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    const language = supportedLanguages.find(lang => lang.code === languageCode);
    if (!language) {
      console.warn('Language not found:', languageCode);
      return;
    }

    console.log('Changing language to:', languageCode, language.name);

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      setCurrentLanguage(language);
      console.log('Language changed successfully to:', language.name, 'Code:', languageCode);
      console.log('Current language state updated:', language);
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error saving language preference:', error);
      throw error;
    }
  };

  const clearLanguagePreference = async () => {
    try {
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
      console.log('Language preference cleared');
      setCurrentLanguage(supportedLanguages[1]); // Reset to English
    } catch (error) {
      console.error('Error clearing language preference:', error);
    }
  };

  // Translation function with nested key support
  const t = (key: string, params?: Record<string, string>): string => {
    try {
      // Debug logging for key translation issues
      if (key === 'common.continue' || key === 'common.cancel' || key === 'onboarding.personal.datePicker.title' || key === 'settings.language.title' || key === 'dashboard.welcome') {
        console.log('Translating key:', key, 'for language:', currentLanguage.code);
      }
      
      // Get translations for current language first
      const languageTranslations = translations[currentLanguage.code as keyof typeof translations] as any;
      
      if (!languageTranslations) {
        console.warn(`No translations found for language: ${currentLanguage.code}`);
        // Try English as fallback
        const englishTranslations = translations.en as any;
        if (englishTranslations) {
          console.log('Falling back to English translations');
          return getTranslationFromObject(englishTranslations, key, params) || key;
        }
        return key;
      }
      
      // Try to get translation from current language
      let translation = getTranslationFromObject(languageTranslations, key, params);
      
      // Debug the translation lookup
      if (key === 'dashboard.welcome' || key === 'common.cancel') {
        console.log('Looking up key:', key, 'in language:', currentLanguage.code);
        console.log('Available translations keys:', Object.keys(languageTranslations));
        console.log('Translation result:', translation);
        if (key === 'common.cancel') {
          console.log('Common section exists:', !!languageTranslations.common);
          if (languageTranslations.common) {
            console.log('Common section keys:', Object.keys(languageTranslations.common));
            console.log('Cancel key value:', languageTranslations.common.cancel);
          }
        }
      }
      
      // If not found in current language, try English fallback
      if (!translation && currentLanguage.code !== 'en') {
            const englishTranslations = translations.en as any;
        if (englishTranslations) {
          translation = getTranslationFromObject(englishTranslations, key, params);
          if (translation) {
            console.log(`Using English fallback for key: ${key}`);
          }
        }
      }
      
      // Return translation or key if not found
      return translation || key;
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        loading,
        clearLanguagePreference,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};