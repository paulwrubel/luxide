import { ToggleSwitch } from 'flowbite-react';

interface ToggleControlProps {
  form: any; // TanStack Form instance (generic — will be tightened in Phase 5)
  field: string;
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
}

export default function ToggleControl({
  form,
  field,
  label,
  labelPrefix,
  labelSuffix,
  disabled,
}: ToggleControlProps) {
  const displayLabel = [labelPrefix, label, labelSuffix]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex max-w-full flex-col">
      <form.Field name={field}>
        {(f: any) => (
          <ToggleSwitch
            checked={f.state.value}
            onChange={(checked) => f.handleChange(checked)}
            disabled={disabled}
            label={displayLabel}
          />
        )}
      </form.Field>
    </div>
  );
}
