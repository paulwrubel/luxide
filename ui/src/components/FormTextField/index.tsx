import { useFieldContext } from '@/hooks/formContext';
import { Label, TextInput, HelperText } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';

export type FormTextFieldProps = {
  type?: 'text' | 'number';
  valueLabel: string;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  extraIsErrored?: boolean;
  unenforcedStep?: number;
  required?: boolean;
  className?: string;
};

export function FormTextField(props: FormTextFieldProps) {
  const {
    type = 'text',
    valueLabel,
    onInput,
    onChange,
    extraIsErrored,
    unenforcedStep,
    required,
    className,
  } = props;

  const field = useFieldContext<string | number>();

  const errors = field.state.meta.errors;
  const hasErrors = errors.length > 0 || !!extraIsErrored;

  return (
    <Label className="mb-0 flex w-full flex-col">
      <span className="flex-1 overflow-hidden px-2 text-ellipsis">{valueLabel}</span>
      <TextInput
        type={type}
        required={required}
        className={className}
        color={hasErrors ? 'failure' : undefined}
        value={field.state.value ?? ''}
        onChange={(e) => {
          // number inputs emit "" when cleared; passing the raw value
          // through handleChange preserves invalid state for Zod error display
          field.handleChange(
            (type === 'number' && e.target.value !== ''
              ? Number(e.target.value)
              : e.target.value) as never,
          );
          onChange?.(e);
        }}
        onInput={onInput}
        step={unenforcedStep}
      />
      {hasErrors && errors.length > 0 && (
        <HelperText color="failure">
          {errors
            .map((e: { message?: string } | string) => (typeof e === 'string' ? e : e?.message))
            .filter(Boolean)
            .join(', ')}
        </HelperText>
      )}
    </Label>
  );
}
