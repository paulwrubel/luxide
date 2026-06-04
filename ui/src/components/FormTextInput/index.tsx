import { Label, TextInput, HelperText } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';

export type FormTextInputProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  fieldName: string;
  type?: 'text' | 'number';
  valueLabel: string;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  extraIsErrored?: boolean;
  unenforcedStep?: number;
  required?: boolean;
  className?: string;
};

export function FormTextInput(props: FormTextInputProps) {
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
      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        (field: { state: { value: any; meta: { errors: any[] } }; handleChange: (updater: any) => void }) => {
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
              value={(field.state.value as string | number | undefined) ?? ''}
              onChange={(e) => {
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
      }}
    </form.Field>
  );
}
