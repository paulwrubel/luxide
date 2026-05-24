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
  allowWrappingLabel,
  labelPrefix,
  labelSuffix,
  disabled,
}: ToggleControlProps) {
  return (
    <div className="flex max-w-full flex-col">
      <form.Field name={field}>
        {(f: any) => (
          <ToggleSwitch
            checked={f.state.value}
            onChange={(e) => f.handleChange(e.target.checked)}
            disabled={disabled}
            label={
              <h6 className="overflow-hidden font-normal">
                <span
              className={`flex items-center gap-2 ${allowWrappingLabel ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                >
                  {labelPrefix}
                  {label}
                  {labelSuffix}
                </span>
              </h6>
            }
          />
        )}
      </form.Field>
    </div>
  );
}
