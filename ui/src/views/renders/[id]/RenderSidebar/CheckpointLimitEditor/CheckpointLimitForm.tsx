import { useSelector } from '@tanstack/react-store';
import { Button, Spinner } from 'flowbite-react';
import { useAppForm } from '@/hooks/useAppForm';
import { useUpdateRenderTotalCheckpoints } from '@/hooks/useRenderMutations';
import { z } from 'zod';
import toast from 'react-hot-toast';

export type CheckpointLimitFormProps = {
  currentValue: number;
  currentCheckpointIteration: number;
  renderID: number;
};

export function CheckpointLimitForm(props: CheckpointLimitFormProps) {
  const { currentValue, currentCheckpointIteration, renderID } = props;

  const { mutate: updateCheckpoints, isPending } = useUpdateRenderTotalCheckpoints();

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
          toast.error(error.message);
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
    </>
  );
}
