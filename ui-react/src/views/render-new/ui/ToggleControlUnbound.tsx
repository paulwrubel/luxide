import { ToggleSwitch } from 'flowbite-react';
import type { ChangeEvent, FormEvent } from 'react';

interface ToggleControlUnboundProps {
  checked: boolean;
  oninput?: (e: FormEvent<HTMLInputElement>) => void;
  onchange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
}

export default function ToggleControlUnbound({
  checked,
  oninput,
  onchange,
  label,
  labelPrefix,
  labelSuffix,
  disabled,
}: ToggleControlUnboundProps) {
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
            onchange?.(syntheticEvent);
            oninput?.(syntheticEvent as unknown as FormEvent<HTMLInputElement>);
          }}
          disabled={disabled}
          label={label}
        />
        {labelSuffix}
      </div>
    </div>
  );
}
