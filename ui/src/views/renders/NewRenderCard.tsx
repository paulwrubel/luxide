import { Card, type CardTheme } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { HiPlusCircle } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';

export function NewRenderCard() {
  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-dashed border-zinc-50 dark:border-zinc-50',
      children: 'p-0',
    },
  };

  return (
    <Link to="/renders/new">
      <Card theme={cardTheme} className="h-66 text-zinc-200 hover:bg-zinc-900">
        <div className="flex h-full w-full items-center justify-center gap-2">
          <HiPlusCircle className="h-8 w-8" />
          <h2 className="text-lg font-normal italic">New Render</h2>
        </div>
      </Card>
    </Link>
  );
}
