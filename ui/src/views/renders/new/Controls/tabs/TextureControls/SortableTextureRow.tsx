import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiBars3 } from 'react-icons/hi2';
import { TextureRow, type TextureRowProps } from './TextureRow';

export type SortableTextureRowProps = TextureRowProps & {
  id: string;
};

export function SortableTextureRow(props: SortableTextureRowProps) {
  const { id, ...rowProps } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        type="button"
        className="cursor-grab touch-none px-1 py-2 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <HiBars3 className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <TextureRow {...rowProps} />
      </div>
    </div>
  );
}
