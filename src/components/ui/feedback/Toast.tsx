"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2
} from "lucide-react";

// Types
export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, "id">>) => void;
  // Shortcuts
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook personnalisé
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Provider
interface ToastProviderProps {
  children: ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = "top-right",
  maxToasts = 5
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === "loading" ? 0 : 5000)
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove si duration > 0
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, "id">>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    // Si on change le type depuis loading vers autre chose avec duration
    if (updates.type && updates.type !== "loading") {
      const duration = updates.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    }
  }, [removeToast]);

  // Shortcuts
  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "error", title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
    [addToast]
  );

  const loading = useCallback(
    (title: string, description?: string) =>
      addToast({ type: "loading", title, description, duration: 0 }),
    [addToast]
  );

  const promise = useCallback(
    async <T,>(
      promiseToResolve: Promise<T>,
      messages: { loading: string; success: string; error: string }
    ): Promise<T> => {
      const id = loading(messages.loading);
      try {
        const result = await promiseToResolve;
        updateToast(id, { type: "success", title: messages.success, duration: 5000 });
        return result;
      } catch (err) {
        updateToast(id, { type: "error", title: messages.error, duration: 5000 });
        throw err;
      }
    },
    [loading, updateToast]
  );

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
        promise
      }}
    >
      {children}

      {/* Toast Container */}
      <div className={`fixed z-[100] flex flex-col gap-2 ${positionClasses[position]}`}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Toast Item Component
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
  };

  const bgColors = {
    success: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30",
    error: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
    loading: "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }}
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[400px]
        ${bgColors[toast.type]}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button (not for loading) */}
      {toast.type !== "loading" && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Standalone Toast Component (for use without context)
interface StandaloneToastProps {
  type: ToastType;
  title: string;
  description?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function StandaloneToast({ type, title, description, isVisible, onClose }: StandaloneToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 right-4 z-[100]">
          <ToastItem
            toast={{ id: "standalone", type, title, description }}
            onClose={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
