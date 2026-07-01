import { useSelector } from '@tanstack/react-store';
import { Button, Spinner } from 'flowbite-react';
import { HiCheck } from 'react-icons/hi2';
import { useAppForm } from '@/hooks/useAppForm';
import { useUpdateRenderTotalCheckpointsMutation } from '@/hooks/useRenderMutations';
import { z } from 'zod';
import { extractErrorMessage } from '@/utils/api';
import toast from 'react-hot-toast';

export type CheckpointLimitFormProps = {
  currentValue: number;
  currentCheckpointIteration: number;
  renderID: number;
};

export function CheckpointLimitForm(props: CheckpointLimitFormProps) {
  const { currentValue, currentCheckpointIteration, renderID } = props;

  const { mutate: updateCheckpoints, isPending } = useUpdateRenderTotalCheckpointsMutation();

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
      { renderID, newTotalCheckpoints: value },
      {
        onError: (error) => {
          toast.error(extractErrorMessage(error));
        },
      },
    );
  }

  return (
    <>
      <form.AppField name="total_checkpoints">
        {(field) => (
          <div className="flex items-end gap-2">
            <field.FormTextField
              type="number"
              valueLabel="Checkpoint Limit"
              required
              className="flex-1"
            />
            <Button
              title="Update Checkpoint Limit"
              size="sm"
              outline
              color="gray"
              onClick={handleSubmit}
              disabled={isPending || !isFormValid}
            >
              {isPending ? <Spinner size="sm" /> : <HiCheck className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </form.AppField>
    </>
  );
}
