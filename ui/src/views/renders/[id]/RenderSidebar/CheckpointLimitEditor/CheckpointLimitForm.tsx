import { Button, Spinner, TextInput, Label, HelperText } from 'flowbite-react';
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
      <form.Field name="total_checkpoints">
        {(field) => {
          const errors = field.state.meta.errors;
          const hasErrors = errors.length > 0;

          return (
            <Label>
              <span className="mb-1 block">Checkpoint Limit</span>
              <TextInput
                type="number"
                required
                className="w-full"
                color={hasErrors ? 'failure' : undefined}
                value={(field.state.value as number | undefined) ?? ''}
                onChange={(e) => {
                  field.handleChange(
                    (e.target.value !== '' ? Number(e.target.value) : e.target.value) as number,
                  );
                }}
              />
              {hasErrors && errors.length > 0 && (
                <HelperText color="failure">
                  {errors
                    .map((e) => (typeof e === 'string' ? e : e?.message))
                    .filter(Boolean)
                    .join(', ')}
                </HelperText>
              )}
            </Label>
          );
        }}
      </form.Field>

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
