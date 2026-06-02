import { Card, type CardTheme } from 'flowbite-react';
import { HiPlusCircle } from 'react-icons/hi2';
import type { DeepPartial } from 'flowbite-react/types';

export type NewRenderCardProps = {
  onClick: () => void;
};

export function NewRenderCard(props: NewRenderCardProps) {
  const { onClick } = props;

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'bg-zinc-950 dark:bg-zinc-950 border-2 border-dashed border-zinc-50 dark:border-zinc-50 hover:rounded-lg',
      children: 'p-0',
    },
  };

  return (
    <Card theme={cardTheme} className="h-66">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full items-center justify-center gap-2 text-zinc-200 hover:rounded-lg hover:bg-zinc-900"
      >
        <HiPlusCircle className="h-6 w-6" />
        <span className="text-base font-normal italic">New Render</span>
      </button>
    </Card>
  );
}
