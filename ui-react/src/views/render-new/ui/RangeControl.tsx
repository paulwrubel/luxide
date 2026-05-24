import { Label, RangeSlider } from 'flowbite-react';


interface RangeControlProps {
  form: any;
  field: string;
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export default function RangeControl({
  form,
  field,
  label,
  labelPrefix,
  labelSuffix,
  min,
  max,
  step,
}: RangeControlProps) {
  return (
    <form.Field name={field}>
      {(f: any) => (
        <Label className="mb-2 flex flex-col gap-1.5">
          <span className="flex justify-between">
            <span className="flex gap-2">
              {labelPrefix}
              {label}
              {labelSuffix}
            </span>
            <span>{f.state.value}</span>
          </span>
          <RangeSlider
            value={f.state.value as number}
            onChange={(e) => f.handleChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
          />
        </Label>
      )}
    </form.Field>
  );
}
