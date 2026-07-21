import { getGridColumnsStyle } from './utils';
import type { ChangeEvent, InputEvent } from 'react';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';

export type TextInputControlProps = {
  form: RenderForm;
  fieldName: RenderFormPath;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number';
  label: string;
  labelSpacePercentage?: number;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  valueLabel: string;
};

export function TextInputControl(props: TextInputControlProps) {
  const {
    form,
    fieldName,
    onInput,
    onChange,
    type = 'text',
    label,
    labelSpacePercentage = 40,
    allowWrappingLabel,
    labelPrefix,
    labelSuffix,
    valueLabel,
  } = props;

  const gridStyle = getGridColumnsStyle(labelSpacePercentage);

  return (
    <div className="grid items-center" style={gridStyle}>
      <h6 className="mt-3 overflow-hidden font-normal">
        <span
          className={`flex items-center gap-2 ${allowWrappingLabel ? 'whitespace-normal' : 'whitespace-nowrap'}`}
        >
          {labelPrefix}
          {label}
          {labelSuffix}
        </span>
      </h6>
      <div className="flex flex-col">
        <div className="items-flex-end flex gap-2">
          <form.AppField name={fieldName}>
            {(field) => (
              <field.FormTextField
                type={type}
                valueLabel={valueLabel}
                onInput={onInput}
                onChange={onChange}
              />
            )}
          </form.AppField>
        </div>
      </div>
    </div>
  );
}
