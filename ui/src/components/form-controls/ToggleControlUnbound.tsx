import { ToggleSwitch } from 'flowbite-react';
import type { ChangeEvent, InputEvent } from 'react';

export type ToggleControlUnboundProps = {
  checked: boolean;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
};

export function ToggleControlUnbound(props: ToggleControlUnboundProps) {
  const { checked, onInput, onChange, label, labelPrefix, labelSuffix, disabled } = props;

  return (
    <div className="flex max-w-full flex-col">
      <div className="flex items-center gap-2">
        {labelPrefix}
        <ToggleSwitch
          checked={checked}
          onChange={(newChecked) => {
            const syntheticEvent = {
              target: { checked: newChecked },
              // onChange provides boolean, not a DOM event;
              // synthesize a ChangeEvent so callers receive a consistent interface
            } as ChangeEvent<HTMLInputElement>;
            onChange?.(syntheticEvent);
            // same synthetic event adapted to the InputEvent shape
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
