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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(supportedLanguages[1]); // Default to English
  const [loading, setLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      // Clear any existing preference and start fresh with English
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
      console.log('Cleared any existing language preference, starting with English');
      setCurrentLanguage(supportedLanguages[1]); // English
    } catch (error) {
      console.error('Error loading saved language:', error);
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
      console.log('Language changed successfully to:', language.name);
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
      if (key === 'common.continue' || key === 'onboarding.personal.datePicker.title') {
        console.log('Translating key:', key, 'for language:', currentLanguage.code);
      }
      // Quick fallbacks for common keys
      if (key === 'common.continue') {
        if (currentLanguage.code === 'en') return 'Continue';
        if (currentLanguage.code === 'de') return 'Weiter';
        if (currentLanguage.code === 'fr') return 'Continuer';
        if (currentLanguage.code === 'es') return 'Continuar';
        if (currentLanguage.code === 'it') return 'Continua';
        if (currentLanguage.code === 'nl') return 'Doorgaan';
      }
      
      if (key === 'common.cancel') {
        if (currentLanguage.code === 'en') return 'Cancel';
        if (currentLanguage.code === 'de') return 'Abbrechen';
        if (currentLanguage.code === 'fr') return 'Annuler';
        if (currentLanguage.code === 'es') return 'Cancelar';
        if (currentLanguage.code === 'it') return 'Annulla';
        if (currentLanguage.code === 'nl') return 'Annuleren';
      }
      
      if (key === 'onboarding.personal.datePicker.confirm') {
        if (currentLanguage.code === 'en') return 'Confirm';
        if (currentLanguage.code === 'de') return 'Bestätigen';
        if (currentLanguage.code === 'fr') return 'Confirmer';
        if (currentLanguage.code === 'es') return 'Confirmar';
        if (currentLanguage.code === 'it') return 'Conferma';
        if (currentLanguage.code === 'nl') return 'Bevestigen';
      }
      
      if (key === 'onboarding.personal.datePicker.title') {
        if (currentLanguage.code === 'en') return 'Select birth date';
        if (currentLanguage.code === 'de') return 'Geburtsdatum auswählen';
        if (currentLanguage.code === 'fr') return 'Sélectionner la date de naissance';
        if (currentLanguage.code === 'es') return 'Seleccionar fecha de nacimiento';
        if (currentLanguage.code === 'it') return 'Seleziona data di nascita';
        if (currentLanguage.code === 'nl') return 'Selecteer geboortedatum';
      }
      
      if (key === 'onboarding.personal.datePicker.year') {
        if (currentLanguage.code === 'en') return 'Year';
        if (currentLanguage.code === 'de') return 'Jahr';
        if (currentLanguage.code === 'fr') return 'Année';
        if (currentLanguage.code === 'es') return 'Año';
        if (currentLanguage.code === 'it') return 'Anno';
        if (currentLanguage.code === 'nl') return 'Jaar';
      }
      
      if (key === 'onboarding.personal.datePicker.month') {
        if (currentLanguage.code === 'en') return 'Month';
        if (currentLanguage.code === 'de') return 'Monat';
        if (currentLanguage.code === 'fr') return 'Mois';
        if (currentLanguage.code === 'es') return 'Mes';
        if (currentLanguage.code === 'it') return 'Mese';
        if (currentLanguage.code === 'nl') return 'Maand';
      }
      
      if (key === 'onboarding.personal.datePicker.day') {
        if (currentLanguage.code === 'en') return 'Day';
        if (currentLanguage.code === 'de') return 'Tag';
        if (currentLanguage.code === 'fr') return 'Jour';
        if (currentLanguage.code === 'es') return 'Día';
        if (currentLanguage.code === 'it') return 'Giorno';
        if (currentLanguage.code === 'nl') return 'Dag';
      }
      
      // Quick fallbacks for interests label
      if (key === 'onboarding.personal.interests.label') {
        if (currentLanguage.code === 'en') return 'What are your interests? (optional)';
        if (currentLanguage.code === 'de') return 'Was sind Ihre Interessen? (optional)';
        if (currentLanguage.code === 'fr') return 'Quels sont vos centres d\'intérêt ? (optionnel)';
        if (currentLanguage.code === 'es') return '¿Cuáles son tus intereses? (opcional)';
        if (currentLanguage.code === 'it') return 'Quali sono i tuoi interessi? (opzionale)';
        if (currentLanguage.code === 'nl') return 'Wat zijn je interesses? (optioneel)';
      }
      
      // Quick fallbacks for interests subtitle
      if (key === 'onboarding.personal.interests.subtitle') {
        if (currentLanguage.code === 'en') return 'Select up to 5 areas that interest you';
        if (currentLanguage.code === 'de') return 'Wählen Sie bis zu 5 Bereiche aus, die Sie interessieren';
        if (currentLanguage.code === 'fr') return 'Sélectionnez jusqu\'à 5 domaines qui vous intéressent';
        if (currentLanguage.code === 'es') return 'Selecciona hasta 5 áreas que te interesan';
        if (currentLanguage.code === 'it') return 'Seleziona fino a 5 aree che ti interessano';
        if (currentLanguage.code === 'nl') return 'Selecteer maximaal 5 gebieden die je interesseren';
      }
      
      // Personal info labels
      if (key === 'onboarding.personal.name.label') {
        if (currentLanguage.code === 'en') return 'What would you like to be called?';
        if (currentLanguage.code === 'de') return 'Wie möchten Sie genannt werden?';
        if (currentLanguage.code === 'fr') return 'Comment aimeriez-vous être appelé?';
        if (currentLanguage.code === 'es') return '¿Cómo te gustaría que te llamen?';
        if (currentLanguage.code === 'it') return 'Come vorresti essere chiamato?';
        if (currentLanguage.code === 'nl') return 'Hoe wil je genoemd worden?';
      }
      
      if (key === 'onboarding.personal.birthdate.label') {
        if (currentLanguage.code === 'en') return 'Date of birth';
        if (currentLanguage.code === 'de') return 'Geburtsdatum';
        if (currentLanguage.code === 'fr') return 'Date de naissance';
        if (currentLanguage.code === 'es') return 'Fecha de nacimiento';
        if (currentLanguage.code === 'it') return 'Data di nascita';
        if (currentLanguage.code === 'nl') return 'Geboortedatum';
      }
      
      if (key === 'onboarding.personal.role.label') {
        if (currentLanguage.code === 'en') return 'What is your role in the family?';
        if (currentLanguage.code === 'de') return 'Was ist Ihre Rolle in der Familie?';
        if (currentLanguage.code === 'fr') return 'Quel est votre rôle dans la famille?';
        if (currentLanguage.code === 'es') return '¿Cuál es tu papel en la familia?';
        if (currentLanguage.code === 'it') return 'Qual è il tuo ruolo nella famiglia?';
        if (currentLanguage.code === 'nl') return 'Wat is je rol in het gezin?';
      }
      
      if (key === 'onboarding.personal.datePicker.placeholder') {
        if (currentLanguage.code === 'en') return 'Select birth date';
        if (currentLanguage.code === 'de') return 'Geburtsdatum auswählen';
        if (currentLanguage.code === 'fr') return 'Sélectionner la date de naissance';
        if (currentLanguage.code === 'es') return 'Seleccionar fecha de nacimiento';
        if (currentLanguage.code === 'it') return 'Seleziona data di nascita';
        if (currentLanguage.code === 'nl') return 'Selecteer geboortedatum';
      }
      
      if (key === 'onboarding.personal.name.placeholder') {
        if (currentLanguage.code === 'en') return 'Your first name or nickname';
        if (currentLanguage.code === 'de') return 'Ihr Vorname oder Nickname';
        if (currentLanguage.code === 'fr') return 'Votre prénom ou surnom';
        if (currentLanguage.code === 'es') return 'Tu nombre o apodo';
        if (currentLanguage.code === 'it') return 'Il tuo nome o soprannome';
        if (currentLanguage.code === 'nl') return 'Je voornaam of bijnaam';
      }
      
      const languageTranslations = translations[currentLanguage.code as keyof typeof translations] as any;
      
      if (!languageTranslations) {
        console.warn(`No translations found for language: ${currentLanguage.code}`);
        return key;
      }
      
      // Support nested keys like 'onboarding.welcome.title'
      const keys = key.split('.');
      let translation: any = languageTranslations;
      
      for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
          translation = translation[k];
        } else {
          // Fallback to English if current language doesn't have the key
          if (currentLanguage.code !== 'en') {
            const englishTranslations = translations.en as any;
            let englishTranslation: any = englishTranslations;
            const keysCopy = key.split('.');
            for (const ek of keysCopy) {
              if (englishTranslation && typeof englishTranslation === 'object' && ek in englishTranslation) {
                englishTranslation = englishTranslation[ek];
              } else {
                console.warn(`Translation key not found: ${key} (tried fallback to English)`);
                return key;
              }
            }
            if (typeof englishTranslation === 'string') {
              translation = englishTranslation;
              break;
            }
          }
          console.warn(`Translation key not found: ${key} in language: ${currentLanguage.code}`);
          return key;
        }
      }
      
      // Ensure we have a string
      if (typeof translation !== 'string') {
        return key;
      }

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }

    return translation;
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