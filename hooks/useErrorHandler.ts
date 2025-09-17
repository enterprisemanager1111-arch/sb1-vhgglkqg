/**
 * Custom hook for consistent error handling across the app
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: unknown, customMessage?: string) => void;
  clearError: () => void;
  showAlert: (title: string, message: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let errorMessage = customMessage || 'Ein unbekannter Fehler ist aufgetreten';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setError(errorMessage);
    
    // Show alert for immediate user feedback
    Alert.alert('Fehler', errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    Alert.alert(title, message);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
    showAlert,
  };
};

/**
 * Higher-order function to wrap async operations with error handling
 */
export const withErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: (error: unknown) => void,
  customMessage?: string
) => {
  return async (...args: T): Promise<R | void> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
      if (customMessage) {
        console.error(customMessage, error);
      }
    }
  };
};