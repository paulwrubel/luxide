import { useRender } from '@/hooks/useRender';
import { Spinner } from 'flowbite-react';

export type RenderInfoProps = {
  renderID: number;
};

/** render info card showing image dimensions, samples, max bounces, and creation date */
export function RenderInfo(props: RenderInfoProps) {
  const { renderID } = props;

  const renderQuery = useRender({ renderID });

  return (
    <div className="rounded border border-zinc-700 p-3">
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">Render Info</h3>
      {renderQuery.isPending ? (
        <div className="flex justify-center">
          <Spinner size="md" className="fill-zinc-400" />
        </div>
      ) : renderQuery.error ? (
        <p className="text-sm text-red-500">
          Error loading render info: {renderQuery.error.message}
        </p>
      ) : (
        <div className="flex flex-col gap-1 text-sm text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Image</span>
            <span className="text-zinc-300">
              {renderQuery.data.config.parameters.image_dimensions[0]} ×{' '}
              {renderQuery.data.config.parameters.image_dimensions[1]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Samples</span>
            <span className="text-zinc-300">
              {renderQuery.data.config.parameters.samples_per_checkpoint}/ckpt
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Max bounces</span>
            <span className="text-zinc-300">{renderQuery.data.config.parameters.max_bounces}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Created</span>
            <span className="text-right text-zinc-300">
              <div>
                {new Date(renderQuery.data.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div>
                {new Date(renderQuery.data.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
