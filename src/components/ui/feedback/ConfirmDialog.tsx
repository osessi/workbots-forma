"use client";

import { motion, AnimatePresence } from "framer-motion";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle, Trash2, LogOut, X, AlertCircle, Info } from "lucide-react";

// Types
export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title: string;
  description: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  // Shortcuts
  confirmDelete: (itemName?: string) => Promise<boolean>;
  confirmLogout: () => Promise<boolean>;
  confirmDiscard: () => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// Hook personnalisé
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

// Provider
interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(true);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
  }, [resolvePromise]);

  // Shortcuts
  const confirmDelete = useCallback(
    (itemName?: string) =>
      confirm({
        title: "Confirmer la suppression",
        description: itemName
          ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
          : "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
        variant: "danger",
        confirmLabel: "Supprimer",
        icon: <Trash2 className="w-6 h-6" />
      }),
    [confirm]
  );

  const confirmLogout = useCallback(
    () =>
      confirm({
        title: "Déconnexion",
        description: "Êtes-vous sûr de vouloir vous déconnecter ?",
        variant: "warning",
        confirmLabel: "Se déconnecter",
        icon: <LogOut className="w-6 h-6" />
      }),
    [confirm]
  );

  const confirmDiscard = useCallback(
    () =>
      confirm({
        title: "Abandonner les modifications",
        description: "Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter sans sauvegarder ?",
        variant: "warning",
        confirmLabel: "Quitter sans sauvegarder",
        cancelLabel: "Continuer l'édition"
      }),
    [confirm]
  );

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, confirmLogout, confirmDiscard }}>
      {children}

      {/* Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        options={options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

// Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, options, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!options) return null;

  const {
    title,
    description,
    variant = "danger",
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    icon
  } = options;

  const variantStyles = {
    danger: {
      iconBg: "bg-red-100 dark:bg-red-500/20",
      iconColor: "text-red-600 dark:text-red-400",
      buttonBg: "bg-red-600 hover:bg-red-700",
      defaultIcon: <AlertTriangle className="w-6 h-6" />
    },
    warning: {
      iconBg: "bg-amber-100 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
      defaultIcon: <AlertCircle className="w-6 h-6" />
    },
    info: {
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      defaultIcon: <Info className="w-6 h-6" />
    }
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl pointer-events-auto"
            >
              <div className="p-6">
                {/* Icon */}
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                  <div className={styles.iconColor}>
                    {icon || styles.defaultIcon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${styles.buttonBg}`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Standalone Confirm Dialog (for use without context)
interface StandaloneConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StandaloneConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  ...options
}: StandaloneConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      options={options}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
