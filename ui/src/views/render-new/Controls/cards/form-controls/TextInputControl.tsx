import { FormTextInput } from './FormTextInput';
import { getGridColumnsTemplateForPercentage } from './utils';
import type { ChangeEvent, InputEvent } from 'react';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';

interface TextInputControlProps {
  form: RenderForm;
  fieldName: RenderFormPath;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'number';
  label: string;
  labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  valueLabel: string;
}

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

  const gridStr = getGridColumnsTemplateForPercentage(labelSpacePercentage);

  return (
    <div className={`grid items-center ${gridStr}`}>
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
          <FormTextInput
            form={form}
            fieldName={fieldName}
            onInput={onInput}
            onChange={onChange}
            type={type}
            valueLabel={valueLabel}
          />
        </div>
      </div>
    </div>
  );
}
