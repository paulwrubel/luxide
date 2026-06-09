import { useSelector } from '@tanstack/react-store';
import { Button, Spinner } from 'flowbite-react';
import { HiCheck } from 'react-icons/hi2';
import { useAppForm } from '@/hooks/useAppForm';
import { useUpdateRenderName } from '@/hooks/useRenderMutations';
import { z } from 'zod';
import { extractErrorMessage } from '@/utils/api';
import toast from 'react-hot-toast';

export type RenameFormProps = {
  currentName: string;
  renderID: number;
};

export function RenameForm(props: RenameFormProps) {
  const { currentName, renderID } = props;

  const { mutate: updateName, isPending } = useUpdateRenderName();

  const form = useAppForm({
    defaultValues: { name: currentName },
    validators: {
      onChange: z.object({
        name: z.string().min(1, 'Name is required'),
      }),
    },
  });

  const isFormValid = useSelector(form.store, (state) => state.isValid);

  function handleSubmit() {
    const { name } = form.state.values;
    updateName(
      { renderId: renderID, newName: name },
      {
        onError: (error) => {
          toast.error(extractErrorMessage(error));
        },
      },
    );
  }

  return (
    <>
      <form.AppField name="name">
        {(field) => (
          <div className="flex items-end gap-2">
            <field.FormTextField type="text" valueLabel="Render Name" required className="flex-1" />
            <Button
              title="Update Render Name"
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
