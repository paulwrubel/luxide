import { ToggleControlUnbound } from './ToggleControlUnbound';
import { Separator } from '../../../components/Separator';
import type { ChangeEvent, FormEvent } from 'react';

interface OptionalControlUnboundProps {
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  checked: boolean;
  oninput?: (e: FormEvent<HTMLInputElement>) => void;
  onchange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function OptionalControlUnbound(props: OptionalControlUnboundProps) {
  const {
    label,
    allowWrappingLabel,
    labelPrefix,
    labelSuffix,
    checked,
    oninput,
    onchange,
    disabled,
    children,
  } = props;

  return (
    <div className="flex max-w-full flex-col">
      <div className="h-px">{checked && <Separator />}</div>
      <ToggleControlUnbound
        checked={checked}
        oninput={oninput}
        onchange={onchange}
        label={label}
        allowWrappingLabel={allowWrappingLabel}
        labelPrefix={labelPrefix}
        labelSuffix={labelSuffix}
        disabled={disabled}
      />
      {checked && (
        <>
          <div>{children}</div>
          <Separator />
        </>
      )}
    </div>
  );
}
