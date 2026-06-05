import { ToggleControlUnbound } from './ToggleControlUnbound';
import { Separator } from '@/components/Separator';
import type { ChangeEvent, InputEvent } from 'react';

export type OptionalControlUnboundProps = {
  label: string;
  allowWrappingLabel?: boolean;
  labelPrefix?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  checked: boolean;
  onInput?: (e: InputEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
};

export function OptionalControlUnbound(props: OptionalControlUnboundProps) {
  const {
    label,
    allowWrappingLabel,
    labelPrefix,
    labelSuffix,
    checked,
    onInput,
    onChange,
    disabled,
    children,
  } = props;

  return (
    <div className="flex max-w-full flex-col">
      <div className="h-px">{checked && <Separator />}</div>
      <ToggleControlUnbound
        checked={checked}
        onInput={onInput}
        onChange={onChange}
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
