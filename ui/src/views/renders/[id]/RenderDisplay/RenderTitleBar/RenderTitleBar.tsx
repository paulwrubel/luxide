import { useRender } from '@/hooks/useRender';
import { Spinner, Button } from 'flowbite-react';
import { HiArrowDownTray } from 'react-icons/hi2';
import { getLatestCheckpointImage } from '@/utils/api';
import { useAuth } from '@/providers/auth';
import { StateBadge } from './StateBadge';

export type RenderTitleBarProps = {
  renderID: number;
};

export function RenderTitleBar(props: RenderTitleBarProps) {
  const { renderID } = props;
  const { mustGetToken } = useAuth();
  const {
    data: render,
    isPending: isRenderPending,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  const handleDownload = async () => {
    if (!render) return;
    const token = mustGetToken();
    const [width, height] = render.config.parameters.image_dimensions;
    const filename = `${render.config.name}-checkpoint-${width}x${height}.png`;
    const blob = await getLatestCheckpointImage(token, renderID);
    if (blob === null) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <div className="flex items-center gap-2">
                <StateBadge renderState={render.state} />
                <Button size="sm" outline color="gray" onClick={handleDownload}>
                  <HiArrowDownTray />
                </Button>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
