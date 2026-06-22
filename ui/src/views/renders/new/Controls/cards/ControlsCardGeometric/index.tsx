import { getGeometricDataSafe } from '@/utils/render/geometric';
import { fixReferences, renameGeometric } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { ControlsCard } from '../ControlsCard';
import { GeometricRenderControls } from './GeometricRenderControls';

export type ControlsCardGeometricProps = {
  form: RenderForm;
  geometricName: string;
};

export function ControlsCardGeometric(props: ControlsCardGeometricProps) {
  const { form, geometricName } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data: geometricData } = getGeometricDataSafe(renderConfig, geometricName);

  function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === geometricName) {
      return;
    }

    const renamed = renameGeometric(renderConfig, geometricName, trimmed);

    form.setFieldValue('textures', renamed.textures);
    form.setFieldValue('materials', renamed.materials);
    form.setFieldValue('geometrics', renamed.geometrics);
    form.setFieldValue('scenes', renamed.scenes);
  }

  function handleDeleteGeometric(name: string) {
    const newGeometrics = { ...renderConfig.geometrics };
    delete newGeometrics[name];

    const newConfig: NormalizedRenderConfig = {
      ...renderConfig,
      geometrics: newGeometrics,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('textures', fixed.textures);
  }

  return (
    <ControlsCard
      leftLabel={geometricName}
      onRename={handleRename}
      rightLabel={geometricData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteGeometric(geometricName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">
        <GeometricRenderControls form={form} name={geometricName} />
      </div>
    </ControlsCard>
  );
}
