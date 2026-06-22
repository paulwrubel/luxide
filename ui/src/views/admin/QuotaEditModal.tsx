import {
  Button,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ToggleSwitch,
} from 'flowbite-react';
import { useSelector } from '@tanstack/react-store';
import { useAppForm } from '@/hooks/useAppForm';
import { z } from 'zod';
import type { User } from '@/utils/api';
import { useUpdateUserQuotasMutation } from '@/hooks/useUserMutations';

export type QuotaEditModalProps = {
  user: User;
  onClose: () => void;
};

export function QuotaEditModal(props: QuotaEditModalProps) {
  const { user, onClose } = props;

  const { mutate: updateQuotas, isPending } = useUpdateUserQuotasMutation();

  const form = useAppForm({
    defaultValues: {
      max_renders: user.max_renders ?? 1,
      max_renders_unlimited: user.max_renders === null,
      max_checkpoints_per_render: user.max_checkpoints_per_render ?? 1,
      max_checkpoints_per_render_unlimited: user.max_checkpoints_per_render === null,
      max_render_pixel_count: user.max_render_pixel_count ?? 250000,
      max_render_pixel_count_unlimited: user.max_render_pixel_count === null,
    },
    validators: {
      onChange: z
        .object({
          max_renders: z.number(),
          max_renders_unlimited: z.boolean(),
          max_checkpoints_per_render: z.number(),
          max_checkpoints_per_render_unlimited: z.boolean(),
          max_render_pixel_count: z.number(),
          max_render_pixel_count_unlimited: z.boolean(),
        })
        .superRefine((data, ctx) => {
          if (!data.max_renders_unlimited) {
            if (!Number.isInteger(data.max_renders) || data.max_renders < 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Must be a positive integer',
                path: ['max_renders'],
              });
            }
          }
          if (!data.max_checkpoints_per_render_unlimited) {
            if (
              !Number.isInteger(data.max_checkpoints_per_render) ||
              data.max_checkpoints_per_render < 1
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Must be a positive integer',
                path: ['max_checkpoints_per_render'],
              });
            }
          }
          if (!data.max_render_pixel_count_unlimited) {
            if (!Number.isInteger(data.max_render_pixel_count) || data.max_render_pixel_count < 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Must be a positive integer',
                path: ['max_render_pixel_count'],
              });
            }
          }
        }),
    },
  });

  const isFormValid = useSelector(form.store, (state) => state.isValid);

  const isMaxRendersUnlimited = useSelector(
    form.store,
    (state) => state.values.max_renders_unlimited,
  );
  const isMaxCheckpointsUnlimited = useSelector(
    form.store,
    (state) => state.values.max_checkpoints_per_render_unlimited,
  );
  const isMaxPixelsUnlimited = useSelector(
    form.store,
    (state) => state.values.max_render_pixel_count_unlimited,
  );

  function handleSave() {
    const values = form.state.values;
    updateQuotas(
      {
        userID: user.id,
        maxRenders: values.max_renders_unlimited ? null : values.max_renders,
        maxCheckpointsPerRender: values.max_checkpoints_per_render_unlimited
          ? null
          : values.max_checkpoints_per_render,
        maxRenderPixelCount: values.max_render_pixel_count_unlimited
          ? null
          : values.max_render_pixel_count,
      },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal show onClose={onClose}>
      <ModalHeader>Edit Quotas for @{user.username}</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4 text-zinc-300">
          {/* max renders */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Max Renders</Label>
              <form.AppField name="max_renders_unlimited">
                {(field) => (
                  <ToggleSwitch
                    checked={field.state.value}
                    label="Unlimited"
                    onChange={(checked) => field.handleChange(checked)}
                  />
                )}
              </form.AppField>
            </div>
            {!isMaxRendersUnlimited && (
              <form.AppField name="max_renders">
                {(field) => (
                  <field.FormTextField type="number" valueLabel="" required className="w-full" />
                )}
              </form.AppField>
            )}
          </fieldset>

          {/* max checkpoints per render */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Max Checkpoints Per Render</Label>
              <form.AppField name="max_checkpoints_per_render_unlimited">
                {(field) => (
                  <ToggleSwitch
                    checked={field.state.value}
                    label="Unlimited"
                    onChange={(checked) => field.handleChange(checked)}
                  />
                )}
              </form.AppField>
            </div>
            {!isMaxCheckpointsUnlimited && (
              <form.AppField name="max_checkpoints_per_render">
                {(field) => (
                  <field.FormTextField type="number" valueLabel="" required className="w-full" />
                )}
              </form.AppField>
            )}
          </fieldset>

          {/* max render pixel count */}
          <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Max Render Pixel Count</Label>
              <form.AppField name="max_render_pixel_count_unlimited">
                {(field) => (
                  <ToggleSwitch
                    checked={field.state.value}
                    label="Unlimited"
                    onChange={(checked) => field.handleChange(checked)}
                  />
                )}
              </form.AppField>
            </div>
            {!isMaxPixelsUnlimited && (
              <form.AppField name="max_render_pixel_count">
                {(field) => (
                  <field.FormTextField type="number" valueLabel="" required className="w-full" />
                )}
              </form.AppField>
            )}
          </fieldset>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending || !isFormValid}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
