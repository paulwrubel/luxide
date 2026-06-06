import { ControlsCard } from './ControlsCard';
import { WarningIconAdvancedProperty } from '../icons/WarningIconAdvancedProperty';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { motion, AnimatePresence } from 'framer-motion';
import { HelperText, Tooltip, ToggleSwitch } from 'flowbite-react';
import { useAuth } from '@/providers/auth';
import { Separator } from '@/components/Separator';
import { useState } from 'react';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';

const DEFAULT_IMPORTANCE_SAMPLING = {
  emissive_weight: 1.0,
  transmissive_weight: 0.0,
  specular_weight: 0.0,
  brdf_weight: 1.0,
  use_multiple_importance_sampling: true,
};

interface ControlsCardParametersProps {
  form: RenderForm;
}

export function ControlsCardParameters(props: ControlsCardParametersProps) {
  const { form } = props;

  const { user } = useAuth();
  const renderConfig = useSelector(form.store, (state) => state.values);
  const parameters = renderConfig.parameters;
  const savedCheckpointLimit = parameters.saved_checkpoint_limit ?? 1;
  const maxCheckpoints = user?.max_checkpoints_per_render ?? null;

  const [savedCheckpointLimitLocal, setSavedCheckpointLimitLocal] = useState(savedCheckpointLimit);

  // derived directly from the form — no separate state needed
  const isCheckpointLimitEnabled = parameters.saved_checkpoint_limit !== undefined;

  function handleToggle(checked: boolean) {
    if (checked) {
      form.setFieldValue('parameters.saved_checkpoint_limit', savedCheckpointLimitLocal);
    } else {
      setSavedCheckpointLimitLocal(savedCheckpointLimit);
      form.setFieldValue('parameters.saved_checkpoint_limit', undefined);
    }
  }

  const [importanceSamplingLocal, setImportanceSamplingLocal] = useState(
    parameters.importance_sampling ?? DEFAULT_IMPORTANCE_SAMPLING,
  );

  const isImportanceSamplingEnabled = parameters.importance_sampling !== undefined;

  function handleImportanceSamplingToggle(checked: boolean) {
    if (checked) {
      form.setFieldValue('parameters.importance_sampling', importanceSamplingLocal);
    } else {
      setImportanceSamplingLocal(
        parameters.importance_sampling ?? DEFAULT_IMPORTANCE_SAMPLING,
      );
      form.setFieldValue('parameters.importance_sampling', undefined);
    }
  }

  return (
    <ControlsCard leftLabel="parameters" leftLabelStyle="light" startExpanded>
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
                    {w.toLocaleString()} × {h.toLocaleString()} ={' '}
                    {pixelCount.toLocaleString()} px
                    {maxPixels !== null && (
                      <>
                        {' '}
                        (limit: {maxPixels.toLocaleString()})
                      </>
                    )}
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
                      // TanStack Form includes undefined in array field error unions
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

        <div className="h-px">
          <AnimatePresence>
            {isCheckpointLimitEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Separator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex w-full items-center justify-between py-2">
          <h6 className="overflow-hidden font-normal">
            <span className="flex items-center gap-2">
              Enforce Checkpoint Limit?
              <WarningIconAdvancedProperty />
            </span>
          </h6>
          <ToggleSwitch
            checked={isCheckpointLimitEnabled}
            onChange={handleToggle}
            disabled={maxCheckpoints !== null}
          />
        </div>
        <AnimatePresence initial={false}>
          {isCheckpointLimitEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
              onAnimationStart={() => {
                form.validate('change');
              }}
            >
              <div className="py-2">
                <TextInputControl
                  form={form}
                  fieldName="parameters.saved_checkpoint_limit"
                  label="Saved Checkpoint Limit"
                  labelSpacePercentage={70}
                  valueLabel="checkpoints"
                  type="number"
                  labelSuffix={<WarningIconAdvancedProperty />}
                />
              </div>
              <Separator />
            </motion.div>
          )}
        </AnimatePresence>

        {maxCheckpoints !== null && (
          <Tooltip
            content={`As a non-admin user, you are limited to ${maxCheckpoints} checkpoints saved per render.`}
          >
            <span className="text-sm text-zinc-400">ⓘ Checkpoint limit enforced</span>
          </Tooltip>
        )}

        <TextInputControl
          form={form}
          fieldName="parameters.max_bounces"
          label="Max Light Bounces"
          labelSpacePercentage={70}
          valueLabel="bounces"
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <form.AppField name="parameters.use_scaling_truncation">
          {(field) => <field.ToggleControl label="Use Scaling Truncation" labelSuffix={<WarningIconAdvancedProperty />} />}
        </form.AppField>
        {/* Importance Sampling toggle + animated section */}
        <div className="h-px">
          <AnimatePresence>
            {isImportanceSamplingEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Separator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex w-full items-center justify-between py-2">
          <h6 className="overflow-hidden font-normal">
            <span className="flex items-center gap-2">
              Use Importance Sampling?
              <WarningIconAdvancedProperty />
            </span>
          </h6>
          <ToggleSwitch
            checked={isImportanceSamplingEnabled}
            onChange={handleImportanceSamplingToggle}
          />
        </div>
        <AnimatePresence initial={false}>
          {isImportanceSamplingEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
              onAnimationStart={() => {
                form.validate('change');
              }}
            >
              <div className="py-2">
                <TextInputControl
                  form={form}
                  fieldName="parameters.importance_sampling.emissive_weight"
                  label="Emissive Weight"
                  labelSpacePercentage={70}
                  valueLabel="weight"
                  type="number"
                  labelSuffix={<WarningIconAdvancedProperty />}
                />
                <TextInputControl
                  form={form}
                  fieldName="parameters.importance_sampling.transmissive_weight"
                  label="Transmissive Weight"
                  labelSpacePercentage={70}
                  valueLabel="weight"
                  type="number"
                  labelSuffix={<WarningIconAdvancedProperty />}
                />
                <TextInputControl
                  form={form}
                  fieldName="parameters.importance_sampling.specular_weight"
                  label="Specular Weight"
                  labelSpacePercentage={70}
                  valueLabel="weight"
                  type="number"
                  labelSuffix={<WarningIconAdvancedProperty />}
                />
                <TextInputControl
                  form={form}
                  fieldName="parameters.importance_sampling.brdf_weight"
                  label="BRDF Weight"
                  labelSpacePercentage={70}
                  valueLabel="weight"
                  type="number"
                  labelSuffix={<WarningIconAdvancedProperty />}
                />
                <form.AppField name="parameters.importance_sampling.use_multiple_importance_sampling">
                  {(field) => (
                    <field.ToggleControl
                      label="Use Multiple Importance Sampling"
                      labelSuffix={<WarningIconAdvancedProperty />}
                    />
                  )}
                </form.AppField>
              </div>
              <Separator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ControlsCard>
  );
}
