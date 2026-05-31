import { Card, type CardTheme } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiPlusCircle, HiArrowUpTray } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';

interface NewRenderCardProps {
  onImport: () => void;
}

export function NewRenderCard({ onImport }: NewRenderCardProps) {
  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-dashed border-zinc-50 dark:border-zinc-50',
      children: 'p-0',
    },
  };

  return (
    <Card theme={cardTheme} className="h-66">
      <div className="flex h-full flex-col">
        <Link
          to="/renders/new"
          className="flex flex-1 items-center justify-center gap-2 text-zinc-200 hover:bg-zinc-900"
        >
          <HiPlusCircle className="h-6 w-6" />
          <span className="text-base font-normal italic">New Render</span>
        </Link>
        <div className="mx-4 border-t border-dashed border-zinc-700" />
        <button
          onClick={onImport}
          className="flex flex-1 items-center justify-center gap-2 text-zinc-200 hover:bg-zinc-900"
        >
          <HiArrowUpTray className="h-6 w-6" />
          <span className="text-base font-normal italic">Import Config</span>
        </button>
      </div>
    </Card>
  );
}
