import { useState } from 'react';
import { Card } from 'flowbite-react';
import { ChevronDownIcon, ChevronUpIcon } from 'flowbite-react';
import Separator from './Separator';

type LabelType = 'bold' | 'light';

interface ControlsCardProps {
  children: React.ReactNode;
  startExpanded?: boolean;
  leftLabel?: string;
  leftLabelStyle?: LabelType;
  rightLabel?: string;
  rightLabelStyle?: LabelType;
}

function LabelText({ text, type }: { text: string; type: LabelType }) {
  if (type === 'bold') {
    return <h2 className="text-xl font-bold">{text}</h2>;
  }
  return <h2 className="text-xl font-light italic">{text}</h2>;
}

export default function ControlsCard({
  children,
  startExpanded = false,
  leftLabel,
  leftLabelStyle = 'bold',
  rightLabel,
  rightLabelStyle = 'light',
}: ControlsCardProps) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);

  return (
    <Card className="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
      <button
        className="flex items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {leftLabel ? (
          <LabelText text={leftLabel} type={leftLabelStyle} />
        ) : (
          <span />
        )}
        <div className="flex flex-row">
          {rightLabel && <LabelText text={rightLabel} type={rightLabelStyle} />}
          {isExpanded ? (
            <ChevronUpIcon className="h-8 w-auto" />
          ) : (
            <ChevronDownIcon className="h-8 w-auto" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div>
          <Separator />
          {children}
        </div>
      )}
    </Card>
  );
}
