import React from 'react';
import Toast from './Toast';
import { useToast } from '../contexts/ToastContext';
import '../styles/components/ToastContainer.css';

interface ToastContainerProps {
  children?: React.ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </>
  );
};

export default ToastContainer; 