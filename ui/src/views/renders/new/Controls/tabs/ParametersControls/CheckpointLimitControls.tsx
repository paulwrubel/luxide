import { useState } from 'react';
import { Tooltip, ToggleSwitch } from 'flowbite-react';
import { useAuth } from '@/providers/Auth';
// import { Separator } from '@/components/Separator';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { AnimatedSeparator } from '@/components/AnimatedSeparator';
import { ExpandableSection } from '@/components/ExpandableSection';
import { WarningIconAdvancedProperty } from '../../shared/icons/WarningIconAdvancedProperty';
import { useSelector } from '@tanstack/react-store';
import type { RenderForm } from '@/hooks/useRenderForm';

export type CheckpointLimitControlsProps = {
  form: RenderForm;
};

export function CheckpointLimitControls(props: CheckpointLimitControlsProps) {
  const { form } = props;

  const { user } = useAuth();
  const parameters = useSelector(form.store, (state) => state.values.parameters);
  const savedCheckpointLimit = parameters.saved_checkpoint_limit ?? 1;
  const maxCheckpoints = user?.max_checkpoints_per_render ?? null;

  const [savedCheckpointLimitLocal, setSavedCheckpointLimitLocal] = useState(savedCheckpointLimit);

  const isCheckpointLimitEnabled = parameters.saved_checkpoint_limit !== undefined;

  function handleToggle(checked: boolean) {
    if (checked) {
      form.setFieldValue('parameters.saved_checkpoint_limit', savedCheckpointLimitLocal);
    } else {
      setSavedCheckpointLimitLocal(savedCheckpointLimit);
      form.setFieldValue('parameters.saved_checkpoint_limit', undefined);
    }
  }

  return (
    <>
      <AnimatedSeparator visible={isCheckpointLimitEnabled} />
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
      <ExpandableSection
        expanded={isCheckpointLimitEnabled}
        onExpandEnd={() => {
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
        {/* <Separator /> */}
      </ExpandableSection>
      {maxCheckpoints !== null && (
        <Tooltip
          content={`As a non-admin user, you are limited to ${maxCheckpoints} checkpoints saved per render.`}
        >
          <span className="text-sm text-zinc-400">ⓘ Checkpoint limit enforced</span>
        </Tooltip>
      )}
      <AnimatedSeparator visible={isCheckpointLimitEnabled} />
    </>
  );
}
