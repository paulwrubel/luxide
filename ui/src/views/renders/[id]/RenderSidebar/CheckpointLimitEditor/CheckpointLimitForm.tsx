import { HiExclamation } from 'react-icons/hi';
import { useState } from 'react';

import { Button, Spinner, Toast, ToastToggle } from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { useAppForm } from '@/hooks/useAppForm';
import { useUpdateRenderTotalCheckpoints } from '@/hooks/useRenderMutations';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

export type CheckpointLimitFormProps = {
  currentValue: number;
  currentCheckpointIteration: number;
  renderID: number;
};

export function CheckpointLimitForm(props: CheckpointLimitFormProps) {
  const { currentValue, currentCheckpointIteration, renderID } = props;

  const { mutate: updateCheckpoints, isPending } = useUpdateRenderTotalCheckpoints();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          setErrorMessage(error.message);
        },
      },
    );
  }

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

      <AnimatePresence>
        {errorMessage !== null && (
          <motion.div
            className="fixed right-4 bottom-4 z-50"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Toast>
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
                <HiExclamation className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-normal text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
              <ToastToggle onDismiss={() => setErrorMessage(null)} />
            </Toast>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
