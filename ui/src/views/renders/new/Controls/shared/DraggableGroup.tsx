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

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className="absolute top-4 left-0 z-10 cursor-grab touch-none px-1 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <HiBars3 className="h-4 w-4" />
      </button>
      <div className="flex flex-col pl-6">{children}</div>
    </div>
  );
}
