import { useRender } from '@/hooks/useRender';
import { Spinner } from 'flowbite-react';
import { StateBadge } from './StateBadge';

export type RenderTitleBarProps = {
  renderID: number;
};

export function RenderTitleBar(props: RenderTitleBarProps) {
  const { renderID } = props;
  const {
    data: render,
    isPending: isRenderPending,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  return (
    <div className="flex w-full shrink-0 items-center justify-between px-6 py-3">
      {isRenderPending ? (
        <Spinner size="sm" />
      ) : isRenderError ? (
        <p className="text-sm text-red-500">Error loading render: {renderError.message}</p>
      ) : (
        (() => {
          return (
            <>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {render.config.name}
              </h2>
              <StateBadge renderState={render.state} />
            </>
          );
        })()
      )}
    </div>
  );
}
