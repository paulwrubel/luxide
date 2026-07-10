import { useRenderQuery } from '@/hooks/useRender';
import { Button, Spinner } from 'flowbite-react';
import { PropertyRow } from './PropertyRow';
import { ViewRenderJSONButton } from '@/components/ViewRenderJSONButton';
import { Separator } from '@/components/Separator';
import { useRenderStatsQuery } from '@/hooks/useRenderStats';
import { useNavigate } from 'react-router-dom';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { normalizeRenderConfig } from '@/utils/render/config';
import { withDefaultEntities } from '@/utils/render/templates';
import { saveRenderDraft } from '@/hooks/useRenderForm';

/**
 * formats a pixel sample count for display.
 * - Under 10M: comma-separated (e.g., "3,125,000")
 * - 10M-999M: abbreviated with one decimal (e.g., "12.5M")
 * - 1B+: abbreviated with one decimal (e.g., "1.3B")
 */
function formatPixelCount(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)} billion`;
  }
  if (count >= 10_000_000) {
    return `${(count / 1_000_000).toFixed(1)} million`;
  }
  return count.toLocaleString();
}

function formatPercentage(percentage: number): string {
  // convert to fixed-point with 4 decimal places (e.g. 0.4257 → 4257)
  const significand = Math.round(percentage * 10_000);

  // determine precision by checking trailing digits
  let precision: number;
  if (significand % 100 === 0) {
    precision = 0;
  } else if (significand % 10 === 0) {
    precision = 1;
  } else {
    precision = 2;
  }

  // convert back to percentage
  return `${(significand / 100).toFixed(precision)}%`;
}

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
  } = useRenderQuery({ renderID });

  const { data: renderStats } = useRenderStatsQuery({ renderID });

  const navigate = useNavigate();

  function handleClone() {
    if (!render) {
      return;
    }
    const normalizedConfig = normalizeRenderConfig(render.config);
    const configWithDefaults = withDefaultEntities(normalizedConfig);
    const modifiedConfig = { ...configWithDefaults, name: `${configWithDefaults.name} (copy)` };
    saveRenderDraft(modifiedConfig);
    navigate('/renders/new', { replace: true });
  }

  const totalSamples = renderStats
    ? renderStats.total_iterations * renderStats.pixel_samples_per_checkpoint
    : undefined;

  const totalProgressPercentage = renderStats
    ? renderStats.total_samples_taken / totalSamples!
    : undefined;

  return (
    <div className="rounded border border-zinc-700 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Render Info</h3>
      </div>
      {isRenderLoading || !render ? (
        <div className="flex justify-center">
          <Spinner size="md" className="fill-zinc-400" />
        </div>
      ) : isRenderError ? (
        <p className="text-sm text-red-500">Error loading render info: {renderError.message}</p>
      ) : (
        <div className="mb-2 flex flex-col gap-1 text-sm text-zinc-400">
          <PropertyRow
            label="Image"
            value={`${render.config.parameters.image_dimensions[0]} × ${render.config.parameters.image_dimensions[1]}`}
          />
          <PropertyRow
            label="Samples"
            value={`${render.config.parameters.samples_per_checkpoint}/ckpt`}
          />
          <PropertyRow label="Max bounces" value={render.config.parameters.bounces.max} />
          <PropertyRow
            label="Russian roulette"
            value={
              render.config.parameters.bounces.use_russian_roulette_after !== null
                ? `After ${render.config.parameters.bounces.use_russian_roulette_after} bounces`
                : 'Disabled'
            }
          />
          <PropertyRow
            label="Total checkpoints"
            value={render.config.parameters.total_checkpoints}
          />
          {renderStats && totalSamples && totalProgressPercentage && (
            <>
              <PropertyRow
                label="Samples taken"
                value={
                  <span title={renderStats.total_samples_taken.toLocaleString()}>
                    {formatPixelCount(renderStats.total_samples_taken)}
                  </span>
                }
              />
              <PropertyRow
                label="Total samples"
                value={
                  <span title={totalSamples.toLocaleString()}>
                    {formatPixelCount(totalSamples)}
                  </span>
                }
              />{' '}
              <PropertyRow
                label="Overall progress"
                value={formatPercentage(totalProgressPercentage)}
              />
            </>
          )}
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
      {render && (
        <>
          <Separator />
          <div className="flex items-center gap-2 pt-3 *:flex-1">
            <ViewRenderJSONButton config={render.config} size="xs" />
            <Button color="default" size="xs" onClick={handleClone}>
              <HiDocumentDuplicate />
              Clone
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
