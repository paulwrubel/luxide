export type SeparatorProps = {
  vertical?: boolean;
  className?: string;
};

export function Separator(props: SeparatorProps) {
  const { vertical, className } = props;

  if (vertical) {
    return <span className={`my-0.5 border-r border-zinc-600 ${className ?? ''}`} />;
  }
  return <div className={`my-0.5 border-b border-zinc-600 ${className ?? ''}`} />;
}
