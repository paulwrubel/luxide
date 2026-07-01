import { Children } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiBars3 } from 'react-icons/hi2';

export type DraggableGroupProps = {
  id: string;
  children: React.ReactNode;
};

export function DraggableGroup(props: DraggableGroupProps) {
  const { id, children } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const childArray = Children.toArray(children);
  const [first, ...rest] = childArray;
  const hasRest = rest.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <button
          type="button"
          className="cursor-grab touch-none px-1 py-2 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <HiBars3 className="h-4 w-4" />
        </button>
        <div className="flex-1">{first}</div>
      </div>
      {hasRest && (
        <div className="flex items-start">
          <div className="w-6 shrink-0" />
          <div className="flex-1">{rest}</div>
        </div>
      )}
    </div>
  );
}
