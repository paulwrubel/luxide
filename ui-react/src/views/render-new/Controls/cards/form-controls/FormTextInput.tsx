import { Label, TextInput, HelperText } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';
import type { RenderForm, RenderFormPath } from '../../../../../hooks/useRenderForm';

interface FormTextInputProps {
  form: RenderForm;
  field: RenderFormPath;
  type?: 'text' | 'number';
  valueLabel: string;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  extraIsErrored?: boolean;
  unenforcedStep?: number;
}

export function FormTextInput(props: FormTextInputProps) {
  const {
    form,
    field,
    type = 'text',
    valueLabel,
    onInput,
    onChange,
    extraIsErrored,
    unenforcedStep,
  } = props;

  return (
    <form.Field name={field}>
      {(fieldApi) => {
        const errors = fieldApi.state.meta.errors;
        const hasErrors = errors.length > 0 || !!extraIsErrored;

        // Determine step: unenforcedStep overrides everything
        const stepValue = unenforcedStep ?? (type === 'number' ? undefined : undefined);

        return (
          <Label className="mb-0 flex w-full flex-col">
            <span className="flex-1 overflow-hidden px-2 text-ellipsis">{valueLabel}</span>
            <TextInput
              name={field}
              type={type}
              color={hasErrors ? 'failure' : undefined}
              value={(fieldApi.state.value as string | number | undefined) ?? ''}
              onChange={(e) => {
                fieldApi.handleChange(
                  type === 'number' && e.target.value !== ''
                    ? Number(e.target.value)
                    : e.target.value,
                );
                onChange?.(e);
              }}
              onInput={onInput}
              step={stepValue}
            />
            {hasErrors && errors.length > 0 && (
              <HelperText color="failure">{errors.join(', ')}</HelperText>
            )}
          </Label>
        );
      }}
    </form.Field>
  );
}
