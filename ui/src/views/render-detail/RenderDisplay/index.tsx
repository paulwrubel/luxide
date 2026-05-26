import type { Render } from '@/utils/api';
import type { UseQueryResult } from '@tanstack/react-query';
import { Spinner } from 'flowbite-react';
import { StateDisplay } from './StateDisplay';

export type RenderDisplayProps = {
  renderQuery: UseQueryResult<Render, Error>;
  imageURLQuery: UseQueryResult<string, Error>;
};

/** main content area showing the checkpoint image and render state progress */
export function RenderDisplay(props: RenderDisplayProps) {
  const { renderQuery, imageURLQuery } = props;

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 px-8">
      {/* checkpoint image */}
      {imageURLQuery.isPending && <p>Loading...</p>}
      {imageURLQuery.isError && (
        <p>Error loading checkpoint image: {imageURLQuery.error?.message}</p>
      )}
      {imageURLQuery.isSuccess && (
        <img alt="Render" src={imageURLQuery.data} className="rounded border border-zinc-700" />
      )}

      {/* render state */}
      {renderQuery.isPending && (
        <div className="flex justify-center p-4">
          <Spinner size="lg" color="info" />
        </div>
      )}
      {renderQuery.isError && <p>Error loading render: {renderQuery.error?.message}</p>}
      {renderQuery.isSuccess && (
        <StateDisplay
          state={renderQuery.data.state}
          totalCheckpoints={renderQuery.data.config.parameters.total_checkpoints}
        />
      )}
    </div>
  );
}
