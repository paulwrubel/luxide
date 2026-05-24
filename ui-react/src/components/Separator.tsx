interface SeparatorProps {
  vertical?: boolean;
  className?: string;
}

export default function Separator({ vertical, className }: SeparatorProps) {
  if (vertical) {
    return <div className={`border-r border-zinc-600 ${className ?? ''}`} />;
  }
  return <div className={`border-b border-zinc-600 ${className ?? ''}`} />;
}
