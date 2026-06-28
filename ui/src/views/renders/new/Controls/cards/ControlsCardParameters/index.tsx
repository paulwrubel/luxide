import { AccordionRow } from '../../AccordionRow';
import { WarningIconAdvancedProperty } from '../../icons/WarningIconAdvancedProperty';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { HelperText } from 'flowbite-react';
import { useAuth } from '@/providers/Auth';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { CheckpointLimitControls } from './CheckpointLimitControls';
import { RussianRouletteControls } from './RussianRouletteControls';
import { ImportanceSamplingControls } from './ImportanceSamplingControls';

export type ControlsCardParametersProps = {
  form: RenderForm;
};

export function ControlsCardParameters(props: ControlsCardParametersProps) {
  const { form } = props;

  const { user } = useAuth();
  const renderConfig = useSelector(form.store, (state) => state.values);
  const parameters = renderConfig.parameters;
  return (
    <AccordionRow leftLabel="Parameters" leftLabelStyle="light" startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <TextInputControl form={form} fieldName="name" label="Name" valueLabel="name" />

        <form.AppField name="parameters.image_dimensions">
          {(arrayField) => (
            <>
              <TextArrayInputControl
                form={form}
                fieldName="parameters.image_dimensions"
                label="Size"
                valueLabels={['width', 'height']}
                type="number"
              />
              {(() => {
                const [w, h] = parameters.image_dimensions;
                const pixelCount = w * h;
                const maxPixels = user?.max_render_pixel_count ?? null;
                const exceedsLimit = maxPixels !== null && pixelCount > maxPixels;

                return (
                  <div
                    className={`pl-[40%] text-sm ${exceedsLimit ? 'font-semibold text-red-500' : 'text-zinc-400'}`}
                  >
                    {w.toLocaleString()} × {h.toLocaleString()} = {pixelCount.toLocaleString()} px
                    {maxPixels !== null && <> (limit: {maxPixels.toLocaleString()})</>}
                  </div>
                );
              })()}
              {arrayField.state.meta.errors.length > 0 && (
                <HelperText color="failure" className="pl-[40%]">
                  {arrayField.state.meta.errors
                    .map((e) => {
                      if (typeof e === 'string') {
                        return e;
                      }
                      if (e === undefined) {
                        return '';
                      }
                      return (e as { message?: string }).message ?? '';
                    })
                    .filter(Boolean)
                    .join(', ')}
                </HelperText>
              )}
            </>
          )}
        </form.AppField>

        <TextArrayInputControl
          form={form}
          fieldName="parameters.tile_dimensions"
          label="Tile Size"
          valueLabels={['width', 'height']}
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <TextInputControl
          form={form}
          fieldName="parameters.gamma_correction"
          label="Gamma Correction"
          labelSpacePercentage={70}
          allowWrappingLabel
          valueLabel="gamma"
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <TextInputControl
          form={form}
          fieldName="parameters.samples_per_checkpoint"
          label="Samples Per Checkpoint"
          labelSpacePercentage={70}
          valueLabel="samples"
          type="number"
        />

        <TextInputControl
          form={form}
          fieldName="parameters.total_checkpoints"
          label="Total Checkpoints"
          labelSpacePercentage={70}
          valueLabel="checkpoints"
          type="number"
        />

        <CheckpointLimitControls form={form} />

        <TextInputControl
          form={form}
          fieldName="parameters.bounces.max"
          label="Max Light Bounces"
          labelSpacePercentage={70}
          valueLabel="bounces"
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <form.AppField name="parameters.use_scaling_truncation">
          {(field) => (
            <field.ToggleControl
              label="Use Scaling Truncation"
              labelSuffix={<WarningIconAdvancedProperty />}
            />
          )}
        </form.AppField>

        <RussianRouletteControls form={form} />

        <ImportanceSamplingControls form={form} />
      </div>
    </AccordionRow>
  );
}
