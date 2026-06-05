import { useFieldContext } from '@/hooks/formContext';
import { Label, RangeSlider } from 'flowbite-react';

export type RangeControlProps = {
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
};

export function RangeControl(props: RangeControlProps) {
  const { label, labelPrefix, labelSuffix, min, max, step } = props;

  const field = useFieldContext<number>();

  return (
    <Label className="mb-2 flex flex-col gap-1.5">
      <span className="flex justify-between">
        <span className="flex gap-2">
          {labelPrefix}
          {label}
          {labelSuffix}
        </span>
        <span>{field.state.value}</span>
      </span>
      <RangeSlider
        value={field.state.value}
        onChange={(e) => field.handleChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
    </Label>
  );
}
