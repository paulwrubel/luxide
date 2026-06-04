import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './formContext';
import { FormTextField } from '@/components/FormTextField';
import { SelectControl } from '@/components/form-controls/SelectControl';
import { RangeControl } from '@/components/form-controls/RangeControl';
import { ToggleControl } from '@/components/form-controls/ToggleControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    FormTextField,
    TextArrayInputControl,
    SelectControl,
    RangeControl,
    ToggleControl,
  },
  formComponents: {},
});
