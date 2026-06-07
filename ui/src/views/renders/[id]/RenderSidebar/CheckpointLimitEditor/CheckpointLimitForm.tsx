import { Button, Spinner } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from '@tanstack/react-store';
import { useAppForm } from '@/hooks/useAppForm';
import { z } from 'zod';
import { useAuth } from '@/providers/auth';
import { updateRenderTotalCheckpoints } from '@/utils/api';

export type CheckpointLimitFormProps = {
  currentValue: number;
  currentCheckpointIteration: number;
  renderID: number;
};

export function CheckpointLimitForm(props: CheckpointLimitFormProps) {
  const { currentValue, currentCheckpointIteration, renderID } = props;

  const { mustGetToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

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

  async function handleSubmit() {
    const value = form.state.values.total_checkpoints;
    setIsUpdating(true);
    await updateRenderTotalCheckpoints(mustGetToken(), renderID, value);
    setIsUpdating(false);
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

      <Button color="default" outline onClick={handleSubmit} disabled={isUpdating || !isFormValid}>
        {isUpdating ? (
          <span className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Updating...
          </span>
        ) : (
          'Update'
        )}
      </Button>
    </>
  );
}
