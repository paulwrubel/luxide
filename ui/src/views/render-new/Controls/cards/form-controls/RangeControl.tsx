import { Label, RangeSlider } from 'flowbite-react';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';

interface RangeControlProps {
  form: RenderForm;
  fieldName: RenderFormPath;
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export function RangeControl(props: RangeControlProps) {
  const { form, fieldName, label, labelPrefix, labelSuffix, min, max, step } = props;

  return (
    <form.Field name={fieldName}>
      {(field) => (
        <Label className="mb-2 flex flex-col gap-1.5">
          <span className="flex justify-between">
            <span className="flex gap-2">
              {labelPrefix}
              {label}
              {labelSuffix}
            </span>
            <span>{field.state.value as number}</span>
          </span>
          <RangeSlider
            value={field.state.value as number}
            onChange={(e) => field.handleChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
          />
        </Label>
      )}
    </form.Field>
  );
}
