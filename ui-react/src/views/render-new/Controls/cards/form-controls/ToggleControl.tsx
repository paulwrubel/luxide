import { ToggleSwitch } from 'flowbite-react';

interface ToggleControlProps {
  form: any;
  field: string;
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
}

export function ToggleControl(props: ToggleControlProps) {
  const { form, field, label, labelPrefix, labelSuffix, disabled } = props;

  return (
    <div className="flex max-w-full flex-col">
      <form.Field name={field}>
        {(f: any) => (
          <div className="flex w-full items-center justify-between py-2">
            <h6 className="overflow-hidden font-normal">
              <span className="flex items-center gap-2">
                {labelPrefix}
                {label}
                {labelSuffix}
              </span>
            </h6>
            <ToggleSwitch
              checked={f.state.value}
              onChange={(checked) => f.handleChange(checked)}
              disabled={disabled}
            />
          </div>
        )}
      </form.Field>
    </div>
  );
}
