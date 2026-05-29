import type { UseQueryResult } from '@tanstack/react-query';
import { Spinner } from 'flowbite-react';

export type RenderPreviewProps = {
  imageURLQuery: UseQueryResult<string, Error>;
};

export function RenderPreview(props: RenderPreviewProps) {
  const { imageURLQuery } = props;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4">
      {imageURLQuery.isPending && (
        <Spinner size="xl" color="info" />
      )}
      {imageURLQuery.isError && (
        <p className="text-sm text-zinc-500">
          Error loading checkpoint image: {imageURLQuery.error?.message}
        </p>
      )}
      {imageURLQuery.isSuccess && (
        <img
          alt="Render checkpoint"
          src={imageURLQuery.data}
          className="max-h-full max-w-full rounded border border-zinc-700 object-contain"
        />
      )}
    </div>
  );
}
