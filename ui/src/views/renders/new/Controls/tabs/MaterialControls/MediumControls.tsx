import { useState } from 'react';
import { useSelector } from '@tanstack/react-store';
import { ToggleSwitch } from 'flowbite-react';
import { AnimatedSeparator } from '@/components/AnimatedSeparator';
import { Separator } from '@/components/Separator';
import { ExpandableSection } from '@/components/ExpandableSection';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import type { RenderForm, RenderFormPath } from '@/hooks/useRenderForm';
import type { MediumData, NormalizedMaterialData } from '@/utils/render/material';

export type MediumControlsProps = {
  form: RenderForm;
  materialName: string;
};

const DEFAULT_MEDIUM: MediumData = { type: 'vacuum' };

export function MediumControls(props: MediumControlsProps) {
  const { form, materialName } = props;

  const basePath = `materials.${materialName}.medium_data`;

  const renderConfig = useSelector(form.store, (state) => state.values);
  const material = renderConfig.materials?.[materialName];
  const medium: MediumData | undefined =
    material?.type === 'dielectric' ? material.medium_data : undefined;

  const [mediumLocal, setMediumLocal] = useState<MediumData>(medium ?? DEFAULT_MEDIUM);

  const hasInteriorMedium = medium !== undefined;
  const isHomogeneous = medium?.type === 'homogeneous';

  function setMedium(value: MediumData | undefined) {
    const materials: Record<string, NormalizedMaterialData> = {
      ...(renderConfig.materials ?? {}),
    };
    materials[materialName] = {
      ...material,
      medium_data: value,
    } as NormalizedMaterialData;
    form.setFieldValue('materials', materials);
  }

  function handleToggle(checked: boolean) {
    if (checked) {
      setMedium(mediumLocal);
    } else {
      setMediumLocal(medium ?? DEFAULT_MEDIUM);
      setMedium(undefined);
    }
  }

  function handleTypeChange(newType: string) {
    // replace the entire medium object to ensure the discriminated union
    // is valid — changing only the type would leave missing fields for
    // the new variant.
    if (newType === 'homogeneous') {
      const prev = medium;
      setMedium({
        type: 'homogeneous',
        attenuation_distance: prev?.type === 'homogeneous' ? prev.attenuation_distance : 1.0,
        transmittance:
          prev?.type === 'homogeneous'
            ? (prev.transmittance as [number, number, number])
            : // tS infers number[]; Zod requires 3-element tuple
              ([1, 1, 1] as [number, number, number]),
        emittance:
          prev?.type === 'homogeneous'
            ? (prev.emittance as [number, number, number])
            : // tS infers number[]; Zod requires 3-element tuple
              ([0, 0, 0] as [number, number, number]),
      });
    } else {
      setMedium({ type: 'vacuum' });
    }
  }

  return (
    <>
      <AnimatedSeparator visible={hasInteriorMedium} />
      <div className="flex w-full items-center justify-between py-2">
        <h6 className="overflow-hidden font-normal">Has Interior Medium?</h6>
        <ToggleSwitch checked={hasInteriorMedium} onChange={handleToggle} />
      </div>
      <ExpandableSection expanded={hasInteriorMedium} onExpandEnd={() => form.validate('change')}>
        <div className="flex flex-col gap-2 py-2">
          <form.AppField
            // template literal not inferable as DeepKeys
            name={`${basePath}.type` as RenderFormPath}
          >
            {(field) => (
              <field.SelectControl
                label="Type"
                items={[
                  { label: 'Vacuum', value: 'vacuum' },
                  { label: 'Homogeneous', value: 'homogeneous' },
                ]}
                onChange={(value) => handleTypeChange(value)}
              />
            )}
          </form.AppField>
          {isHomogeneous && (
            <>
              <TextArrayInputControl
                form={form}
                // template literal not inferable as DeepKeys
                fieldName={`${basePath}.transmittance` as RenderFormPath}
                label="Transmittance"
                valueLabels={['r', 'g', 'b']}
                type="number"
                unenforcedStep={0.01}
              />
              <TextInputControl
                form={form}
                // template literal not inferable as DeepKeys
                fieldName={`${basePath}.attenuation_distance` as RenderFormPath}
                label="Attenuation Distance"
                labelSpacePercentage={60}
                type="number"
                valueLabel="units"
              />
              <TextArrayInputControl
                form={form}
                // template literal not inferable as DeepKeys
                fieldName={`${basePath}.emittance` as RenderFormPath}
                label="Emittance"
                valueLabels={['r', 'g', 'b']}
                type="number"
                unenforcedStep={0.01}
              />
            </>
          )}
        </div>
      </ExpandableSection>
      <Separator />
    </>
  );
}
