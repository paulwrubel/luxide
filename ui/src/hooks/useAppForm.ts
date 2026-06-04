import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './formContext';
import { FormTextField } from '@/components/FormTextField';

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FormTextField,
  },
  formComponents: {},
});
