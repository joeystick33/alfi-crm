'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Système de Toast notifications moderne
 * Conforme au design system
 */

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((toast) => {
    const id = Date.now();
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss après duration
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const toast = useCallback((message, options = {}) => {
    return addToast({ message, ...options });
  }, [addToast]);
  
  toast.success = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'success', ...options });
  }, [addToast]);
  
  toast.error = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'error', ...options });
  }, [addToast]);
  
  toast.warning = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'warning', ...options });
  }, [addToast]);
  
  toast.info = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'info', ...options });
  }, [addToast]);
  
  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const variants = {
    default: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: '📋',
      iconColor: 'text-gray-600'
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      icon: '✓',
      iconColor: 'text-success-600'
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      icon: '✕',
      iconColor: 'text-error-600'
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      icon: '⚠',
      iconColor: 'text-warning-600'
    },
    info: {
      bg: 'bg-info-50',
      border: 'border-info-200',
      icon: 'ℹ',
      iconColor: 'text-info-600'
    }
  };
  
  const variant = variants[toast.variant || 'default'];
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-right duration-300',
        variant.bg,
        variant.border
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 text-xl', variant.iconColor)}>
        {variant.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-gray-900 mb-1">{toast.title}</p>
        )}
        <p className="text-sm text-gray-700">{toast.message}</p>
      </div>
      
      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ToastProvider;
