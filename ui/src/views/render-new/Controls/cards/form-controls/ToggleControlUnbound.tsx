import { ToggleSwitch } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';

interface ToggleControlUnboundProps {
  checked: boolean;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
}

export function ToggleControlUnbound(props: ToggleControlUnboundProps) {
  const { checked, onInput, onChange, label, labelPrefix, labelSuffix, disabled } = props;

  return (
    <div className="flex max-w-full flex-col">
      <div className="flex items-center gap-2">
        {labelPrefix}
        <ToggleSwitch
          checked={checked}
          onChange={(checked) => {
            const syntheticEvent = {
              target: { checked },
            } as ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
            onInput?.(syntheticEvent as unknown as InputEvent<HTMLInputElement>);
          }}
          disabled={disabled}
          label={label}
        />
        {labelSuffix}
      </div>
    </div>
  );
}
