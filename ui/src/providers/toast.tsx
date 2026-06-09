import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast, ToastToggle, type ToastTheme } from 'flowbite-react';
import { HiExclamation } from 'react-icons/hi';
import type { DeepPartial } from 'flowbite-react/types';

type ToastItem = {
  id: string;
  message: string;
};

interface ToastContextType {
  /**
   * Create a new error toast. Returns a function that can be called
   * to programmatically dismiss the toast before the user dismisses it manually.
   */
  createToast: (message: string) => () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// override the default max-w-xs so toasts aren't constrained to ~320px
const toastTheme: DeepPartial<ToastTheme> = {
  root: { base: 'max-w-lg' },
};

export type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider(props: ToastProviderProps) {
  const { children } = props;

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const createToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    return () => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ createToast }}>
      {children}

      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              className="max-w-lg"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Toast theme={toastTheme}>
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
                  <HiExclamation className="h-5 w-5" />
                </div>
                <div className="ml-3 text-sm font-normal text-red-600 dark:text-red-400">
                  {toast.message}
                </div>
                <ToastToggle
                  onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                />
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return context;
}
