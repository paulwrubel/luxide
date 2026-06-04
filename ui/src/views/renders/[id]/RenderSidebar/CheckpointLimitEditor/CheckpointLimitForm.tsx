import { Button, Spinner } from 'flowbite-react';
import { FormTextInput } from '@/components/FormTextInput';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
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

  const form = useForm({
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

  async function handleSubmit() {
    const value = form.state.values.total_checkpoints;
    setIsUpdating(true);
    await updateRenderTotalCheckpoints(mustGetToken(), renderID, value);
    setIsUpdating(false);
  }

  return (
    <>
      <FormTextInput
        form={form}
        fieldName="total_checkpoints"
        type="number"
        valueLabel="Checkpoint Limit"
        required
        className="w-full"
      />

      <Button
        color="default"
        outline
        onClick={handleSubmit}
        disabled={
          isUpdating ||
          typeof form.state.values.total_checkpoints !== 'number' ||
          !Number.isInteger(form.state.values.total_checkpoints) ||
          form.state.values.total_checkpoints <= currentCheckpointIteration
        }
      >
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
