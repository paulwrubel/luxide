import { type ReactFormExtendedApi, type DeepKeys } from '@tanstack/react-form';
import { Label, TextInput, HelperText } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';

// useForm is generic over 12 type params with no defaults;
// the 11 validator params default to undefined at runtime
type FormApi<TFormData> = ReactFormExtendedApi<
  TFormData,
  undefined, undefined, undefined, undefined, undefined,
  undefined, undefined, undefined, undefined, undefined,
  undefined
>;

export type FormTextInputProps<TFormData> = {
  form: FormApi<TFormData>;
  fieldName: DeepKeys<TFormData>;
  type?: 'text' | 'number';
  valueLabel: string;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  extraIsErrored?: boolean;
  unenforcedStep?: number;
  required?: boolean;
  className?: string;
};

type blah = InferFormType<>

export function FormTextInput<TFormData>(props: FormTextInputProps<TFormData>) {
  const {
    form,
    fieldName,
    type = 'text',
    valueLabel,
    onInput,
    onChange,
    extraIsErrored,
    unenforcedStep,
    required,
    className,
  } = props;

  return (
    <form.Field name={fieldName}>
      {(field) => {
        const errors = field.state.meta.errors;
        const hasErrors = errors.length > 0 || !!extraIsErrored;

        return (
          <Label className="mb-0 flex w-full flex-col">
            <span className="flex-1 overflow-hidden px-2 text-ellipsis">{valueLabel}</span>
            <TextInput
              name={fieldName}
              type={type}
              required={required}
              className={className}
              color={hasErrors ? 'failure' : undefined}
              // narrow TFieldValue to types that TextInput accepts for display
              value={(field.state.value as string | number | undefined) ?? ''}
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
                  .map((e: { message?: string } | string) =>
                    typeof e === 'string' ? e : e?.message,
                  )
                  .filter(Boolean)
                  .join(', ')}
              </HelperText>
            )}
          </Label>
        );
      }}
    </form.Field>
  );
}
