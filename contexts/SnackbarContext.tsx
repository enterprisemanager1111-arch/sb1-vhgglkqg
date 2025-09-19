import React, { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar, { SnackbarType } from '@/components/Snackbar';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType, duration?: number, action?: { label: string; onPress: () => void }) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: SnackbarType;
    duration: number;
    action?: { label: string; onPress: () => void };
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 4000,
  });

  const showSnackbar = (
    message: string, 
    type: SnackbarType = 'info', 
    duration: number = 4000,
    action?: { label: string; onPress: () => void }
  ) => {
    setSnackbar({
      visible: true,
      message,
      type,
      duration,
      action,
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        action={snackbar.action}
        onDismiss={hideSnackbar}
      />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
