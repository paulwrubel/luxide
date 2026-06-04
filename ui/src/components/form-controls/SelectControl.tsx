import { useFieldContext } from '@/hooks/formContext';
import { Label, Select } from 'flowbite-react';

interface SelectItem {
  name: string;
  value: string;
}

export type SelectControlProps = {
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  items: SelectItem[];
};

export function SelectControl(props: SelectControlProps) {
  const { label, labelPrefix, labelSuffix, items } = props;

  const field = useFieldContext<string>();

  const currentValue = field.state.value;
  const valueLabel = items.some((item) => item.value === currentValue)
    ? currentValue
    : '__MISSING__';

  return (
    <Label className="mb-2 flex flex-col gap-1.5">
      <span className="flex justify-between">
        <span className="flex gap-2">
          {labelPrefix}
          {label}
          {labelSuffix}
        </span>
        <span>{valueLabel}</span>
      </span>
      <Select value={currentValue} onChange={(e) => field.handleChange(e.target.value)}>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.name}
          </option>
        ))}
      </Select>
    </Label>
  );
}
