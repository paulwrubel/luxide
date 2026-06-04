import { useState } from 'react';
import {
  Button,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  ToggleSwitch,
} from 'flowbite-react';
import type { User } from '@/utils/api';
import { useUpdateUserQuotas } from '@/hooks/useUserMutations';

export type QuotaEditModalProps = {
  user: User;
  onClose: () => void;
};

type QuotaFieldState = {
  unlimited: boolean;
  value: number;
};

function fieldStateFromUser(
  user: User,
  key: 'max_renders' | 'max_checkpoints_per_render' | 'max_render_pixel_count',
  defaultVal: number,
): QuotaFieldState {
  const val = user[key];
  if (val === null) {
    return { unlimited: true, value: defaultVal };
  }
  return { unlimited: false, value: val };
}

function quotaValue(state: QuotaFieldState): number | null {
  return state.unlimited ? null : state.value;
}

export function QuotaEditModal(props: QuotaEditModalProps) {
  const { user, onClose } = props;

  const { mutate: updateQuotas, isPending } = useUpdateUserQuotas();

  const [renders, setRenders] = useState(() => fieldStateFromUser(user, 'max_renders', 1));
  const [checkpoints, setCheckpoints] = useState(() =>
    fieldStateFromUser(user, 'max_checkpoints_per_render', 1),
  );
  const [pixels, setPixels] = useState(() =>
    fieldStateFromUser(user, 'max_render_pixel_count', 250000),
  );

  const handleSave = () => {
    updateQuotas(
      {
        userID: user.id,
        maxRenders: quotaValue(renders),
        maxCheckpointsPerRender: quotaValue(checkpoints),
        maxRenderPixelCount: quotaValue(pixels),
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal show onClose={onClose}>
      <ModalHeader>Edit Quotas for @{user.username}</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4 text-zinc-300">
          {/* Max Renders */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-renders" className="text-zinc-300">
                Max Renders
              </Label>
              <ToggleSwitch
                checked={renders.unlimited}
                label="Unlimited"
                onChange={(checked) => setRenders({ unlimited: checked, value: renders.value })}
              />
            </div>
            {!renders.unlimited && (
              <TextInput
                id="max-renders"
                type="number"
                min={0}
                value={renders.value}
                onChange={(e) => setRenders({ ...renders, value: Number(e.target.value) })}
              />
            )}
          </fieldset>

          {/* Max Checkpoints Per Render */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-checkpoints" className="text-zinc-300">
                Max Checkpoints Per Render
              </Label>
              <ToggleSwitch
                checked={checkpoints.unlimited}
                label="Unlimited"
                onChange={(checked) =>
                  setCheckpoints({ unlimited: checked, value: checkpoints.value })
                }
              />
            </div>
            {!checkpoints.unlimited && (
              <TextInput
                id="max-checkpoints"
                type="number"
                min={0}
                value={checkpoints.value}
                onChange={(e) => setCheckpoints({ ...checkpoints, value: Number(e.target.value) })}
              />
            )}
          </fieldset>

          {/* Max Render Pixel Count */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-pixels" className="text-zinc-300">
                Max Render Pixel Count
              </Label>
              <ToggleSwitch
                checked={pixels.unlimited}
                label="Unlimited"
                onChange={(checked) => setPixels({ unlimited: checked, value: pixels.value })}
              />
            </div>
            {!pixels.unlimited && (
              <TextInput
                id="max-pixels"
                type="number"
                min={0}
                value={pixels.value}
                onChange={(e) => setPixels({ ...pixels, value: Number(e.target.value) })}
              />
            )}
          </fieldset>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
