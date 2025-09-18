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
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color="#54FE54" 
              style={styles.spinner}
            />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#161618',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
