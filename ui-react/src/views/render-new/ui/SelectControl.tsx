import { Label, Select } from 'flowbite-react';


interface SelectItem {
  name: string;
  value: string;
}

interface SelectControlProps {
  form: any;
  field: string;
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  items: SelectItem[];
}

export default function SelectControl({
  form,
  field,
  label,
  labelPrefix,
  labelSuffix,
  items,
}: SelectControlProps) {
  return (
    <form.Field name={field}>
      {(f: any) => {
        const currentValue = f.state.value as string;
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
            <Select
              value={currentValue}
              onChange={(e) => f.handleChange(e.target.value)}
            >
              <option value="" disabled>
                &nbsp;
              </option>
              {items.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Label>
        );
      }}
    </form.Field>
  );
}
