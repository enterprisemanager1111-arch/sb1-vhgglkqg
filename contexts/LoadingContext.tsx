import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useLanguage } from './LanguageContext';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { t } = useLanguage();

  const showLoading = (message?: string) => {
    setLoadingMessage(message || t('common.loading') || 'Loading...');
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <LoadingContext.Provider value={{
      isLoading,
      loadingMessage,
      showLoading,
      hideLoading
    }}>
      {children}
      
      {/* Full-screen loading modal */}
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{loadingMessage}</Text>
          <ActivityIndicator size="large" color="#17f196" />
        </View>
      </Modal>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
});

