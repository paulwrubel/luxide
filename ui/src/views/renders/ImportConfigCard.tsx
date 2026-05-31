import { Card, type CardTheme } from 'flowbite-react';
import { HiArrowUpTray } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';

interface ImportConfigCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ImportConfigCard({ onClick, disabled }: ImportConfigCardProps) {
  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-dashed border-zinc-50 dark:border-zinc-50',
      children: 'p-0',
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} className="w-full text-left">
      <Card theme={cardTheme} className="h-66 text-zinc-200 hover:bg-zinc-900">
        <div className="flex h-full w-full items-center justify-center gap-2">
          <HiArrowUpTray className="h-8 w-8" />
          <h2 className="text-lg font-normal italic">Import Config</h2>
        </div>
      </Card>
    </button>
  );
}
