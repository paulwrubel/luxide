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
  const displayLabel = [labelPrefix, label, labelSuffix]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex max-w-full flex-col">
      <ToggleSwitch
        checked={checked}
        onChange={(checked) => {
          // The native onchange/oninput callbacks expect events, but
          // ToggleSwitch only gives us boolean. Create synthetic events.
          const syntheticEvent = {
            target: { checked },
          } as ChangeEvent<HTMLInputElement>;
          onchange?.(syntheticEvent);
          oninput?.(syntheticEvent as unknown as FormEvent<HTMLInputElement>);
        }}
        disabled={disabled}
        label={displayLabel}
      />
    </div>
  );
}
