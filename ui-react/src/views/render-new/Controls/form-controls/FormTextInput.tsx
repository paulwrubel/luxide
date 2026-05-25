import { Label, TextInput, HelperText } from 'flowbite-react';
import type { ChangeEvent, FormEvent } from 'react';

interface FormTextInputProps {
  form: any;
  field: string;
  type?: 'text' | 'number';
  valueLabel: string;
  oninput?: (e: FormEvent<HTMLInputElement>) => void;
  onchange?: (e: ChangeEvent<HTMLInputElement>) => void;
  extraIsErrored?: boolean;
  unenforcedStep?: number;
}

export function FormTextInput(props: FormTextInputProps) {
  const {
    form,
    field,
    type = 'text',
    valueLabel,
    oninput,
    onchange,
    extraIsErrored,
    unenforcedStep,
  } = props;

  return (
    <form.Field name={field}>
      {(f: any) => {
        const errors = f.state.meta.errors as string[] | undefined;
        const hasErrors = (Array.isArray(errors) && errors.length > 0) || extraIsErrored;

        // Determine step: unenforcedStep overrides everything
        const stepValue = unenforcedStep ?? (type === 'number' ? undefined : undefined);

        return (
          <Label className="mb-0 flex w-full flex-col">
            <span className="flex-1 overflow-hidden px-2 text-ellipsis">{valueLabel}</span>
            <TextInput
              name={field}
              type={type}
              color={hasErrors ? 'failure' : undefined}
              value={f.state.value ?? ''}
              onChange={(e) => {
                f.handleChange(
                  type === 'number' && e.target.value !== ''
                    ? Number(e.target.value)
                    : e.target.value,
                );
                onchange?.(e);
              }}
              onInput={oninput}
              step={stepValue}
            />
            {hasErrors && errors && errors.length > 0 && (
              <HelperText color="failure">{errors.join(', ')}</HelperText>
            )}
          </Label>
        );
      }}
    </form.Field>
  );
}
