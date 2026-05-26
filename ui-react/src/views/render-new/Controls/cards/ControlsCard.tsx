import { useState } from 'react';
import { Card, Button, type CardTheme } from 'flowbite-react';
import { ChevronDownIcon, ChevronUpIcon } from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/Separator';
import { HiTrash } from 'react-icons/hi2';

type LabelType = 'bold' | 'light';

interface ControlsCardProps {
  children: React.ReactNode;
  startExpanded?: boolean;
  leftLabel?: string;
  leftLabelStyle?: LabelType;
  rightLabel?: string;
  rightLabelStyle?: LabelType;
  onDelete?: () => void;
}

function LabelText({ text, type }: { text: string; type: LabelType }) {
  if (type === 'bold') {
    return <h2 className="text-xl font-bold">{text}</h2>;
  }
  return <h2 className="text-lg font-light italic">{text}</h2>;
}

export function ControlsCard(props: ControlsCardProps) {
  const {
    children,
    startExpanded = false,
    leftLabel,
    leftLabelStyle = 'bold',
    rightLabel,
    rightLabelStyle = 'light',
    onDelete,
  } = props;

  const [isExpanded, setIsExpanded] = useState(startExpanded);

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-800 dark:bg-zinc-800',
      children: 'p-0',
    },
  };

  return (
    <Card theme={cardTheme} className="flex max-w-full flex-col text-zinc-200">
      <button
        className="flex items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {leftLabel ? <LabelText text={leftLabel} type={leftLabelStyle} /> : <span />}
        <div className="flex flex-row items-center gap-2">
          {rightLabel && <LabelText text={rightLabel} type={rightLabelStyle} />}
          {isExpanded ? (
            <ChevronUpIcon className="h-8 w-auto" />
          ) : (
            <ChevronDownIcon className="h-8 w-auto" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Separator />
            {children}
            {onDelete && (
              <div className="flex w-full justify-end px-4 pb-4">
                <Button color="red" onClick={onDelete} size="sm">
                  <HiTrash className="h-5 w-5" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
