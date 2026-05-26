import { Label, Select } from 'flowbite-react';
import type { RenderForm, RenderFormPath } from '../../../../../hooks/useRenderForm';

interface SelectItem {
  name: string;
  value: string;
}

interface SelectControlProps {
  form: RenderForm;
  fieldName: RenderFormPath;
  label: string;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  items: SelectItem[];
}

export function SelectControl(props: SelectControlProps) {
  const { form, fieldName, label, labelPrefix, labelSuffix, items } = props;

  return (
    <form.Field name={fieldName}>
      {(field) => {
        const currentValue = field.state.value as string;
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
