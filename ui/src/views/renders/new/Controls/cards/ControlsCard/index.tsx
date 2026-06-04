import { useState } from 'react';
import { Card, Button, type CardTheme } from 'flowbite-react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/Separator';
import { HiTrash } from 'react-icons/hi2';
import { RenamableLabel } from './RenamableLabel';
import { LabelText, type LabelTextProps } from './LabelText';

interface ControlsCardProps {
  children: React.ReactNode;
  startExpanded?: boolean;
  leftLabel: string;
  leftLabelStyle?: LabelTextProps['type'];
  rightLabel?: string;
  rightLabelStyle?: LabelTextProps['type'];
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

export function ControlsCard(props: ControlsCardProps) {
  const {
    children,
    startExpanded = false,
    leftLabel,
    leftLabelStyle = 'bold',
    rightLabel,
    rightLabelStyle = 'light',
    onRename,
    onDelete,
  } = props;

  const [isExpanded, setIsExpanded] = useState(startExpanded);

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-800 dark:bg-zinc-800',
      children: 'gap-0 p-0',
    },
  };

  return (
    <Card theme={cardTheme} className="flex max-w-full flex-col text-zinc-200">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {onRename ? (
          <RenamableLabel label={leftLabel} labelStyle={leftLabelStyle} onRename={onRename} />
        ) : (
          <LabelText text={leftLabel} type={leftLabelStyle} />
        )}
        <div className="flex flex-row items-center gap-2">
          {rightLabel && <LabelText text={rightLabel} type={rightLabelStyle} />}
          {isExpanded ? (
            <HiChevronUp className="h-4 w-auto" />
          ) : (
            <HiChevronDown className="h-4 w-auto" />
          )}
        </div>
      </div>
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
