import { useRender } from '@/hooks/useRender';
import { Spinner } from 'flowbite-react';
import { PropertyRow } from './PropertyRow';
import { ViewRenderJSONButton } from '@/components/ViewRenderJSONButton';

export type RenderInfoProps = {
  renderID: number;
};

export function RenderInfo(props: RenderInfoProps) {
  const { renderID } = props;

  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  return (
    <div className="rounded border border-zinc-700 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Render Info</h3>
        {render && <ViewRenderJSONButton config={render.config} size="xs" />}
      </div>
      {isRenderLoading || !render ? (
        <div className="flex justify-center">
          <Spinner size="md" className="fill-zinc-400" />
        </div>
      ) : isRenderError ? (
        <p className="text-sm text-red-500">Error loading render info: {renderError.message}</p>
      ) : (
        <div className="flex flex-col gap-1 text-sm text-zinc-400">
          <PropertyRow
            label="Image"
            value={`${render.config.parameters.image_dimensions[0]} × ${render.config.parameters.image_dimensions[1]}`}
          />
          <PropertyRow
            label="Samples"
            value={`${render.config.parameters.samples_per_checkpoint}/ckpt`}
          />
          <PropertyRow label="Max bounces" value={render.config.parameters.max_bounces} />
          <PropertyRow
            label="Total checkpoints"
            value={render.config.parameters.total_checkpoints}
          />
          <PropertyRow
            label="Created"
            value={new Date(render.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          />
          <PropertyRow
            label="Updated"
            value={
              <div>
                {new Date(render.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
