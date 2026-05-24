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
  allowWrappingLabel,
  labelPrefix,
  labelSuffix,
  disabled,
}: ToggleControlUnboundProps) {
  return (
    <div className="flex max-w-full flex-col">
      <ToggleSwitch
        checked={checked}
        onChange={(e) => {
          onchange?.(e);
          oninput?.(e as unknown as FormEvent<HTMLInputElement>);
        }}
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
    </div>
  );
}
