import toast, { Toaster, resolveValue } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Toast, ToastToggle, type ToastTheme } from 'flowbite-react';
import { HiExclamation } from 'react-icons/hi';
import type { DeepPartial } from 'flowbite-react/types';

// override the default max-w-xs so toasts aren't constrained to ~320px
const toastTheme: DeepPartial<ToastTheme> = {
  root: { base: 'max-w-lg' },
};

/**
 * Renders all toasts using flowbite-react's `Toast` component with framer-motion
 * animation. Place once at the root of the app — no context or provider needed.
 */
export function LuxideToaster() {
  return (
    <Toaster position="bottom-right" reverseOrder={false}>
      {(t) => (
        <motion.div
          animate={t.visible ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }}
          initial={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="max-w-lg"
        >
          <Toast theme={toastTheme}>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
              <HiExclamation className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-normal text-red-600 dark:text-red-400">
              {resolveValue(t.message, t)}
            </div>
            <ToastToggle onDismiss={() => toast.dismiss(t.id)} />
          </Toast>
        </motion.div>
      )}
    </Toaster>
  );
}
