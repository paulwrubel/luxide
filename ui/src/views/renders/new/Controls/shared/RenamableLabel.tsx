import { useState } from 'react';
import { Button, TextInput, type ButtonProps } from 'flowbite-react';
import { HiPencil, HiCheck } from 'react-icons/hi2';
import { LabelText, type LabelTextProps } from './LabelText';

export type RenamableLabelProps = {
  label: string;
  labelStyle: LabelTextProps['type'];
  onRename: (newName: string) => void;
  afterLabel?: React.ReactNode;
};

export function RenamableLabel(props: RenamableLabelProps) {
  const { label, labelStyle, onRename, afterLabel } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(label);

  function handleConfirm() {
    onRename(editText.trim());
    setIsEditing(false);
  }

  function handleStartEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setEditText(label);
    setIsEditing(true);
  }

  const buttonProps: ButtonProps = {
    size: 'xs',
    outline: true,
    pill: true,
    color: 'dark',
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <TextInput
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
          className="w-40"
        />
        {afterLabel}
        <Button {...buttonProps} onClick={handleConfirm}>
          <HiCheck className="h-4 w-4" />
        </Button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <LabelText text={label} type={labelStyle} className="truncate" title={label} />
      {afterLabel}
      <Button {...buttonProps} onClick={handleStartEditing} className="shrink-0">
        <HiPencil className="h-4 w-4" />
      </Button>
    </span>
  );
}
