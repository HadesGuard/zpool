import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../components/Toast';

interface ToastContextType {
  toasts: ToastMessage[];
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...message, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast({ message, type: 'success', duration });
  }, [addToast]);

  const showError = useCallback((message: string, duration?: number) => {
    addToast({ message, type: 'error', duration });
  }, [addToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    addToast({ message, type: 'info', duration });
  }, [addToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    addToast({ message, type: 'warning', duration });
  }, [addToast]);

  const value = {
    toasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}; 