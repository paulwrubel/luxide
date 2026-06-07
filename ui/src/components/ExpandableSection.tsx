import type { ReactNode } from 'react';

export type ExpandableSectionProps = {
  expanded: boolean;
  onExpandEnd?: () => void;
  children: ReactNode;
};

export function ExpandableSection(props: ExpandableSectionProps) {
  const { expanded, onExpandEnd, children } = props;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out',
        opacity: expanded ? 1 : 0,
      }}
      onTransitionEnd={() => {
        if (expanded && onExpandEnd) {
          onExpandEnd();
        }
      }}
    >
      <div style={{ overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
