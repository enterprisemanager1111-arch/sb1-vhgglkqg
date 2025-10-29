import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from storage
  useEffect(() => {
    loadDarkModePreference();
  }, []);

  const loadDarkModePreference = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem('@dark_mode_enabled');
      if (darkModeValue !== null) {
        setIsDarkMode(JSON.parse(darkModeValue));
      }
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('@dark_mode_enabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const setDarkMode = async (enabled: boolean) => {
    try {
      setIsDarkMode(enabled);
      await AsyncStorage.setItem('@dark_mode_enabled', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}

