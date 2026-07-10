import { getGeometricDataSafe } from '@/utils/render/geometric';
import { fixReferences, renameGeometric } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { AccordionRow } from '../../../shared/AccordionRow';
import { GeometricFormControls } from './GeometricFormControls';
import { WarningIconOrphanGeometric } from '../../../shared/icons/WarningIconOrphanGeometric';
import { InfoIconDefaultEntity } from '../../../shared/icons/InfoIconDefaultEntity';
import { GeometricMoreOptionsDropdown } from './GeometricMoreOptionsDropdown';

export type GeometricRowProps = {
  form: RenderForm;
  geometricName: string;
  depth: number;
  isUsedByActiveScene: boolean;
  isDirectlyInActiveScene: boolean;
};

export function GeometricRow(props: GeometricRowProps) {
  const { form, geometricName, depth, isUsedByActiveScene, isDirectlyInActiveScene } = props;

  const isDefault = geometricName.startsWith('__');

  const afterLabel = (
    <>
      {!isUsedByActiveScene && <WarningIconOrphanGeometric />}
      {isDefault && <InfoIconDefaultEntity />}
    </>
  );

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

  function handleDeleteGeometric() {
    const newGeometrics = { ...renderConfig.geometrics };
    delete newGeometrics[geometricName];

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
    <AccordionRow
      leftLabel={geometricName}
      leftLabelStyle={isDefault ? 'light' : 'bold'}
      onRename={isDefault ? undefined : handleRename}
      rightLabel={geometricData.type}
      rightLabelStyle="light"
      onDelete={isDefault ? undefined : handleDeleteGeometric}
      depth={depth}
      startExpanded={false}
      afterLabel={afterLabel}
      rightActions={
        !isDefault ? (
          <GeometricMoreOptionsDropdown
            form={form}
            geometricName={geometricName}
            isDirectlyInActiveScene={isDirectlyInActiveScene}
            isUsedByActiveScene={isUsedByActiveScene}
          />
        ) : undefined
      }
    >
      <div className="flex w-full flex-col gap-2">
        {!isUsedByActiveScene && (
          <div className="mb-2 flex items-center gap-1">
            <WarningIconOrphanGeometric />
            <p className="text-xs text-yellow-500">
              This geometric is not used by the active scene and will not appear in renders.
            </p>
          </div>
        )}
        <fieldset disabled={isDefault} className="border-0 p-0">
          <GeometricFormControls form={form} name={geometricName} />
        </fieldset>
      </div>
    </AccordionRow>
  );
}
