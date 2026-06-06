import { useState } from 'react';
import { Button, ModalHeader, ModalBody, ModalFooter, Spinner, Alert } from 'flowbite-react';
import { HiArrowLeft } from 'react-icons/hi2';
import { useRenders } from '@/hooks/useRenders';
import { normalizeRenderConfig, type NormalizedRenderConfig } from '@/utils/render/config';
import { withDefaultResources } from '@/utils/render/templates';
import {
  isRenderStateCreated,
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStatePaused,
  isRenderStateFinishedCheckpointIteration,
  type RenderState,
} from '@/utils/api';

export type ExistingRenderPickerProps = {
  onSelect: (config: NormalizedRenderConfig) => void;
  onBack: () => void;
};

function getStateLabel(state: RenderState): string {
  if (isRenderStateCreated(state)) return 'created';
  if (isRenderStateRunning(state)) return 'running';
  if (isRenderStatePausing(state)) return 'pausing';
  if (isRenderStatePaused(state)) return 'paused';
  if (isRenderStateFinishedCheckpointIteration(state)) return 'finished';
  return 'unknown';
}

export function ExistingRenderPicker(props: ExistingRenderPickerProps) {
  const { onSelect, onBack } = props;

  const { data: renders, isLoading, isError } = useRenders();
  const [selectedRenderId, setSelectedRenderId] = useState<number | null>(null);
  const selectedRender = selectedRenderId
    ? (renders?.find((r) => r.id === selectedRenderId) ?? null)
    : null;

  const handleUseConfig = () => {
    if (!selectedRender) return;
    const normalizedConfig = normalizeRenderConfig(selectedRender.config);
    const configWithDefaults = withDefaultResources(normalizedConfig);

    // ensure default resources are present so new materials referencing __white/__black work correctly
    onSelect(configWithDefaults);
  };

  const getStateBadgeClasses = (state: RenderState): string => {
    const label = getStateLabel(state);
    const base = 'rounded-full px-2 py-0.5 text-xs';
    if (label === 'created' || label === 'finished') {
      return `${base} bg-zinc-600 text-zinc-300`;
    }
    if (label === 'running') {
      return `${base} bg-blue-900 text-blue-300`;
    }
    if (label === 'pausing' || label === 'paused') {
      return `${base} bg-yellow-900 text-yellow-300`;
    }
    return `${base} bg-zinc-600 text-zinc-300`;
  };

  return (
    <>
      <ModalHeader>Clone Existing Render</ModalHeader>
      <ModalBody>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {isError && <Alert color="failure">Failed to load renders. Please try again.</Alert>}
        {!isLoading && !isError && renders && renders.length === 0 && (
          <p className="py-8 text-center text-zinc-400">No existing renders to clone.</p>
        )}
        {!isLoading && !isError && renders && renders.length > 0 && (
          <ul className="space-y-1">
            {renders.map((render) => {
              const isSelected = selectedRenderId === render.id;

              return (
                <li key={render.id}>
                  <button
                    type="button"
                    className={`w-full rounded px-3 py-2 text-left ${
                      isSelected ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    }`}
                    onClick={() => setSelectedRenderId(render.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">{render.config.name}</span>
                        <span className="text-sm text-zinc-500">#{render.id}</span>
                      </div>
                      <span className={getStateBadgeClasses(render.state)}>
                        {getStateLabel(render.state)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ModalBody>
      <ModalFooter className="justify-between">
        <Button color="gray" onClick={onBack}>
          <HiArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {selectedRender && (
          <Button color="default" onClick={handleUseConfig}>
            Use This Config
          </Button>
        )}
      </ModalFooter>
    </>
  );
}
