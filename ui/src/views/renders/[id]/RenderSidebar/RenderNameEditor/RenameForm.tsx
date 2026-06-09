import { useSelector } from '@tanstack/react-store';
import { Button, Spinner } from 'flowbite-react';
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
          <field.FormTextField type="text" valueLabel="Render Name" required className="w-full" />
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
