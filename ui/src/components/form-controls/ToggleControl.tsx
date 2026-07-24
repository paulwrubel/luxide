import { FieldLabel } from '@/components/FieldLabel';
import { useFieldContext } from '@/hooks/formContext';
import { ToggleSwitch } from 'flowbite-react';

export type ToggleControlProps = {
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
  tooltip?: React.ReactNode;
};

export function ToggleControl(props: ToggleControlProps) {
  const { label, labelPrefix, labelSuffix, disabled, tooltip } = props;

  const field = useFieldContext<boolean>();

  return (
    <div className="flex max-w-full flex-col">
      <div className="flex w-full items-center justify-between py-2">
        <h6 className="overflow-hidden font-normal">
          <span className="flex items-center gap-2">
            {labelPrefix}
            <FieldLabel tooltipContent={tooltip}>{label}</FieldLabel>
            {labelSuffix}
          </span>
        </h6>
        <ToggleSwitch
          checked={field.state.value}
          onChange={(checked) => field.handleChange(checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
