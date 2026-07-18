import { Children } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiBars3 } from 'react-icons/hi2';

export type DraggableGroupProps = {
  id: string;
  children: React.ReactNode;
  depth?: number;
  handleOffset?: boolean;
};

export function DraggableGroup(props: DraggableGroupProps) {
  const { id, children, depth = 0, handleOffset = false } = props;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // cast needed — CSSProperties doesn't include custom properties
    '--row-depth': depth,
  } as React.CSSProperties;

  // when handleOffset is set, the drag handle "hangs" into the indent gutter
  // so the row's content edge lands exactly on the depth grid
  const marginClass = handleOffset
    ? 'ml-[calc(var(--row-depth)*0.75rem-1.5rem)]'
    : 'ml-[calc(var(--row-depth)*0.75rem)]';

  const childArray = Children.toArray(children);
  const [first, ...rest] = childArray;
  const hasRest = rest.length > 0;

  return (
    <div ref={setNodeRef} style={style} className={`${marginClass} min-w-0`}>
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
        <div className="min-w-0 flex-1">{first}</div>
      </div>
      {hasRest && (
        <div className="flex items-start">
          <div className="w-6 shrink-0" />
          <div className="min-w-0 flex-1">{rest}</div>
        </div>
      )}
    </div>
  );
}
