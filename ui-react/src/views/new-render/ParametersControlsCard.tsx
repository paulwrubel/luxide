import ControlsCard from '../../components/ControlsCard';
import OptionalControlUnbound from '../../components/ui/OptionalControlUnbound';
import WarningIconAdvancedProperty from '../../components/icons/WarningIconAdvancedProperty';
import TextInputControl from '../../components/ui/TextInputControl';
import TextArrayInputControl from '../../components/ui/TextArrayInputControl';
import ToggleControl from '../../components/ui/ToggleControl';
import { Tooltip } from 'flowbite-react';
import { useAuth } from '../../utils/auth';
import { useState } from 'react';
import type { RenderConfig } from '../../utils/render/config';

interface ParametersControlsCardProps {
  form: any;
}

export default function ParametersControlsCard({
  form,
}: ParametersControlsCardProps) {
  const { validUser } = useAuth();
  const renderConfig = form.state.values as RenderConfig;
  const parameters = renderConfig.parameters;
  const savedCheckpointLimit = parameters.saved_checkpoint_limit ?? 1;
  const maxCheckpoints = validUser.max_checkpoints_per_render;

  const [savedCheckpointLimitLocal, setSavedCheckpointLimitLocal] =
    useState(savedCheckpointLimit);

  const isCheckpointLimitEnabled =
    form.state.values.parameters.saved_checkpoint_limit !== undefined;

  return (
    <ControlsCard leftLabel="parameters" leftLabelStyle="light" startExpanded>
      <div className="flex flex-col gap-2 p-4">
        <TextInputControl
          form={form}
          field="name"
          label="Name"
          valueLabel="name"
        />

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

        <OptionalControlUnbound
          label="Enforce Checkpoint Limit?"
          checked={isCheckpointLimitEnabled}
          oninput={(e) => {
            form.setFieldValue(
              'parameters.saved_checkpoint_limit',
              (e as unknown as React.ChangeEvent<HTMLInputElement>).target.checked
                ? savedCheckpointLimitLocal
                : undefined
            );
          }}
          disabled={maxCheckpoints !== null}
          labelSuffix={<WarningIconAdvancedProperty />}
        >
          <TextInputControl
            form={form}
            oninput={(e) => {
              setSavedCheckpointLimitLocal(
                Number((e as React.FormEvent<HTMLInputElement>).currentTarget.value)
              );
            }}
            onchange={(e) => {
              setSavedCheckpointLimitLocal(
                Number((e as React.ChangeEvent<HTMLInputElement>).currentTarget.value)
              );
            }}
            field="parameters.saved_checkpoint_limit"
            label="Saved Checkpoint Limit"
            labelSpacePercentage={70}
            valueLabel="checkpoints"
            type="number"
            labelSuffix={<WarningIconAdvancedProperty />}
          />
        </OptionalControlUnbound>

        {maxCheckpoints !== null && (
          <Tooltip
            content={`As a non-admin user, you are limited to ${maxCheckpoints} checkpoints saved per render.`}
          >
            <span className="text-sm text-zinc-400">
              ⓘ Checkpoint limit enforced
            </span>
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
