'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '@/components/ui/Toast';

const ToastContext = createContext({
  showToast: (message, type = 'info', duration = 4000) => {},
  showSuccess: (message) => {},
  showError: (message) => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
