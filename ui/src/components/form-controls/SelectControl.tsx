import { useFieldContext } from '@/hooks/formContext';
import React from 'react';
import { Label, Select } from 'flowbite-react';

type SelectItem = {
  label: string;
  value: string;
};

export type SelectControlProps = {
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  items: SelectItem[];
  onChange?: (value: string) => void;
  mapValue?: (value: string) => string;
};

export function SelectControl(props: SelectControlProps) {
  const { label, labelPrefix, labelSuffix, items, onChange, mapValue } = props;

  const field = useFieldContext<string>();

  const currentValue = field.state.value;
  const controlValue = mapValue ? mapValue(currentValue) : currentValue;
  const valueLabel = items.find((item) => item.value === controlValue)?.label ?? '__MISSING__';

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
      <Select
        value={controlValue}
        onChange={(e) => {
          if (onChange) {
            onChange(e.target.value);
          } else {
            field.handleChange(e.target.value);
          }
        }}
      >
        {items.map(({ value, label: itemValue }) => (
          <option key={value} value={value}>
            {itemValue}
          </option>
        ))}
      </Select>
    </Label>
  );
}
