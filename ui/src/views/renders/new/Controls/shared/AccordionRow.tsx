import { useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'flowbite-react';
import { HiChevronDown, HiChevronUp, HiTrash } from 'react-icons/hi2';
import { RenamableLabel } from './RenamableLabel';
import { LabelText } from './LabelText';

export type AccordionRowProps = {
  children: React.ReactNode;
  startExpanded?: boolean;
  leftLabel: string;
  leftLabelStyle?: 'bold' | 'light';
  rightLabel?: string;
  rightLabelStyle?: 'bold' | 'light';
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  depth?: number;
  afterLabel?: React.ReactNode;
  rightActions?: React.ReactNode;
};

export function AccordionRow(props: AccordionRowProps) {
  const {
    children,
    startExpanded = false,
    leftLabel,
    leftLabelStyle = 'bold',
    rightLabel,
    rightLabelStyle = 'light',
    onRename,
    onDelete,
    depth = 0,
    afterLabel,
    rightActions,
  } = props;

  const [isExpanded, setIsExpanded] = useState(startExpanded);

  return (
    <div
      className="ml-[calc(var(--row-depth)*1.5rem)] bg-zinc-800"
      // the type for inline styles does not include custom properties like --row-depth
      style={{ '--row-depth': depth } as CSSProperties}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center justify-between border-t border-b border-zinc-700 bg-zinc-800 py-2 pr-3 pl-3 hover:bg-zinc-700/50 dark:bg-zinc-800"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {onRename ? (
          <RenamableLabel
            label={leftLabel}
            labelStyle={leftLabelStyle}
            onRename={onRename}
            afterLabel={afterLabel}
          />
        ) : (
          <span className="inline-flex items-center gap-2">
            <LabelText text={leftLabel} type={leftLabelStyle} />
            {afterLabel}
          </span>
        )}

        <div className="flex flex-row items-center gap-2">
          {rightLabel && <LabelText text={rightLabel} type={rightLabelStyle} />}
          <div onClick={(e) => e.stopPropagation()}>{rightActions}</div>
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
            <div className="px-4 py-2">{children}</div>
            {onDelete && (
              <div className="flex w-full justify-end px-2 pb-2">
                <Button color="red" onClick={onDelete} size="sm">
                  <HiTrash className="h-5 w-5" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
