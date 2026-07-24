import { Tooltip } from 'flowbite-react';

export type FieldLabelProps = {
  children: React.ReactNode;
  tooltipContent?: string | string[];
};

export function FieldLabel(props: FieldLabelProps) {
  const { children, tooltipContent } = props;

  if (tooltipContent === undefined) {
    return <>{children}</>;
  }

  const paragraphs = Array.isArray(tooltipContent) ? tooltipContent : [tooltipContent];

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      }
      className="max-w-sm wrap-break-word whitespace-normal"
    >
      <span className="cursor-help border-b border-dotted border-zinc-400 hover:border-zinc-300">
        {children}
      </span>
    </Tooltip>
  );
}
