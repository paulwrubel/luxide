import { useState } from 'react';
import { ToggleSwitch } from 'flowbite-react';
import { Separator } from '@/components/Separator';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { AnimatedSeparator } from '@/components/AnimatedSeparator';
import { ExpandableSection } from '@/components/ExpandableSection';
import { WarningIconAdvancedProperty } from '../../shared/icons/WarningIconAdvancedProperty';
import { useSelector } from '@tanstack/react-store';
import type { RenderForm } from '@/hooks/useRenderForm';

const DEFAULT_IMPORTANCE_SAMPLING = {
  brdf_weight: 1.0,
  emissive_weight: 1.0,
  transmissive_weight: 0.0,
  specular_weight: 0.0,
  virtual_weight: 0.0,
  use_multiple_importance_sampling: true,
};

export type ImportanceSamplingControlsProps = {
  form: RenderForm;
};

export function ImportanceSamplingControls(props: ImportanceSamplingControlsProps) {
  const { form } = props;

  const parameters = useSelector(form.store, (state) => state.values.parameters);

  const [importanceSamplingLocal, setImportanceSamplingLocal] = useState(
    parameters.importance_sampling ?? DEFAULT_IMPORTANCE_SAMPLING,
  );

  const isImportanceSamplingEnabled = parameters.importance_sampling !== undefined;

  function handleImportanceSamplingToggle(checked: boolean) {
    if (checked) {
      form.setFieldValue('parameters.importance_sampling', importanceSamplingLocal);
    } else {
      setImportanceSamplingLocal(parameters.importance_sampling ?? DEFAULT_IMPORTANCE_SAMPLING);
      form.setFieldValue('parameters.importance_sampling', undefined);
    }
  }

  return (
    <>
      <AnimatedSeparator visible={isImportanceSamplingEnabled} />
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
      <ExpandableSection
        expanded={isImportanceSamplingEnabled}
        onExpandEnd={() => {
          form.validate('change');
        }}
      >
        <div className="py-2">
          <TextInputControl
            form={form}
            fieldName="parameters.importance_sampling.brdf_weight"
            label="BRDF Weight"
            labelSpacePercentage={70}
            valueLabel="weight"
            type="number"
            labelSuffix={<WarningIconAdvancedProperty />}
          />
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
            fieldName="parameters.importance_sampling.virtual_weight"
            label="Virtual Weight"
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
      </ExpandableSection>
    </>
  );
}
