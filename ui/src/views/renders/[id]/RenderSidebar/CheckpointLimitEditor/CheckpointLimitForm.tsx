import { HiExclamation } from 'react-icons/hi';
import { useState } from 'react';

import { Button, Spinner, Toast, ToastToggle, type ToastTheme } from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { useAppForm } from '@/hooks/useAppForm';
import { useUpdateRenderTotalCheckpoints } from '@/hooks/useRenderMutations';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { DeepPartial } from 'flowbite-react/types';

type ToastItem = {
  id: string;
  message: string;
};

export type CheckpointLimitFormProps = {
  currentValue: number;
  currentCheckpointIteration: number;
  renderID: number;
};

export function CheckpointLimitForm(props: CheckpointLimitFormProps) {
  const { currentValue, currentCheckpointIteration, renderID } = props;

  const { mutate: updateCheckpoints, isPending } = useUpdateRenderTotalCheckpoints();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function createToast(message: string) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const form = useAppForm({
    defaultValues: { total_checkpoints: currentValue },
    validators: {
      onChange: z.object({
        total_checkpoints: z
          .number()
          .int('Must be an integer')
          .min(1, 'Must be at least 1')
          .refine((val) => val > currentCheckpointIteration, {
            message: `Must be greater than current checkpoint (${currentCheckpointIteration})`,
          }),
      }),
    },
  });

  const isFormValid = useSelector(form.store, (state) => state.isValid);

  function handleSubmit() {
    const value = form.state.values.total_checkpoints;
    updateCheckpoints(
      { renderId: renderID, newTotalCheckpoints: value },
      {
        onError: (error) => {
          createToast(error.message);
        },
      },
    );
  }

  const toastTheme: DeepPartial<ToastTheme> = {
    root: {
      base: 'max-w-lg',
    },
  };

  return (
    <>
      <form.AppField name="total_checkpoints">
        {(field) => (
          <field.FormTextField
            type="number"
            valueLabel="Checkpoint Limit"
            required
            className="w-full"
          />
        )}
      </form.AppField>

      <Button color="default" outline onClick={handleSubmit} disabled={isPending || !isFormValid}>
        {isPending ? (
          <span className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Updating...
          </span>
        ) : (
          'Update'
        )}
      </Button>

      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
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
                <ToastToggle onDismiss={() => dismissToast(toast.id)} />
              </Toast>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
