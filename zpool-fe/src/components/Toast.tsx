import React, { useEffect } from 'react';
import '../styles/components/Toast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(message.id);
    }, message.duration || 7000);

    return () => clearTimeout(timer);
  }, [message.id, message.duration, onClose]);

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${message.type}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message.message}</span>
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(message.id)}
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
};

export default Toast; 