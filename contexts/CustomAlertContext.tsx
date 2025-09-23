import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert from '@/components/CustomAlert';

interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface CustomAlertContextType {
  showAlert: (config: AlertConfig) => void;
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message: string, onConfirm?: () => void) => void;
  showInfo: (title: string, message: string, onConfirm?: () => void) => void;
  hideAlert: () => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

export function CustomAlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      onConfirm,
    });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'error',
      title,
      message,
      onConfirm,
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      onConfirm,
    });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'info',
      title,
      message,
      onConfirm,
    });
  };

  const hideAlert = () => {
    setVisible(false);
    // Clear config after animation completes
    setTimeout(() => {
      setAlertConfig(null);
    }, 300);
  };

  return (
    <CustomAlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideAlert,
      }}
    >
      {children}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={hideAlert}
          showCancel={alertConfig.showCancel}
          onConfirm={alertConfig.onConfirm}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
        />
      )}
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (context === undefined) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
}
