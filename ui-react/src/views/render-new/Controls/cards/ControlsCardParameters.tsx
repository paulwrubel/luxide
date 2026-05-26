import { ControlsCard } from './ControlsCard';
import { WarningIconAdvancedProperty } from '../icons/WarningIconAdvancedProperty';
import { TextInputControl } from './form-controls/TextInputControl';
import { TextArrayInputControl } from './form-controls/TextArrayInputControl';
import { ToggleControl } from './form-controls/ToggleControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, ToggleSwitch } from 'flowbite-react';
import { useAuth } from '../../../../providers/auth';
import { Separator } from '../../../../components/Separator';
import { useState, useEffect } from 'react';
import type { RenderForm } from '../../../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

interface ControlsCardParametersProps {
  form: RenderForm;
}

export function ControlsCardParameters(props: ControlsCardParametersProps) {
  const { form } = props;

  const { user } = useAuth();
  const renderConfig = useStore(form.store, (state) => state.values);
  const parameters = renderConfig.parameters;
  const savedCheckpointLimit = parameters.saved_checkpoint_limit ?? 1;
  const maxCheckpoints = user?.max_checkpoints_per_render ?? null;

  const [savedCheckpointLimitLocal, setSavedCheckpointLimitLocal] = useState(savedCheckpointLimit);

  const [isCheckpointLimitEnabled, setIsCheckpointLimitEnabled] = useState(
    useStore(form.store, (state) => state.values.parameters.saved_checkpoint_limit) !== undefined,
  );

  // Sync toggle state to form
  useEffect(() => {
    form.setFieldValue(
      'parameters.saved_checkpoint_limit',
      isCheckpointLimitEnabled ? savedCheckpointLimitLocal : undefined,
    );
  }, [form, isCheckpointLimitEnabled, savedCheckpointLimitLocal]);

  return (
    <ControlsCard leftLabel="parameters" leftLabelStyle="light" startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <TextInputControl form={form} field="name" label="Name" valueLabel="name" />

        <TextArrayInputControl
          form={form}
          field="parameters.image_dimensions"
          label="Size"
          valueLabels={['width', 'height']}
          type="number"
        />

        <TextArrayInputControl
          form={form}
          field="parameters.tile_dimensions"
          label="Tile Size"
          valueLabels={['width', 'height']}
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <TextInputControl
          form={form}
          field="parameters.gamma_correction"
          label="Gamma Correction"
          labelSpacePercentage={70}
          allowWrappingLabel
          valueLabel="gamma"
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <TextInputControl
          form={form}
          field="parameters.samples_per_checkpoint"
          label="Samples Per Checkpoint"
          labelSpacePercentage={70}
          valueLabel="samples"
          type="number"
        />

        <TextInputControl
          form={form}
          field="parameters.total_checkpoints"
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
            onChange={setIsCheckpointLimitEnabled}
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
            >
              <div className="py-2">
                <TextInputControl
                  form={form}
                  oninput={(e) => {
                    setSavedCheckpointLimitLocal(
                      Number((e as React.ChangeEvent<HTMLInputElement>).currentTarget.value),
                    );
                  }}
                  onchange={(e) => {
                    setSavedCheckpointLimitLocal(
                      Number((e as React.ChangeEvent<HTMLInputElement>).currentTarget.value),
                    );
                  }}
                  field="parameters.saved_checkpoint_limit"
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
          field="parameters.max_bounces"
          label="Max Light Bounces"
          labelSpacePercentage={70}
          valueLabel="bounces"
          type="number"
          labelSuffix={<WarningIconAdvancedProperty />}
        />

        <ToggleControl
          form={form}
          field="parameters.use_scaling_truncation"
          label="Use Scaling Truncation"
          labelSuffix={<WarningIconAdvancedProperty />}
        />
      </div>
    </ControlsCard>
  );
}
