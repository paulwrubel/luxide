import { ControlsCard } from './ControlsCard';
import { getMaterialData } from '@/utils/render/material';
import { fixReferences, renameMaterial } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';

export type ControlsCardMaterialProps = {
  form: RenderForm;
  materialName: string;
};

export function ControlsCardMaterial(props: ControlsCardMaterialProps) {
  const { form, materialName } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data: materialData } = getMaterialData(renderConfig, materialName);

  function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === materialName) {
      return;
    }

    const renamed = renameMaterial(renderConfig, materialName, trimmed);

    form.setFieldValue('textures', renamed.textures);
    form.setFieldValue('materials', renamed.materials);
    form.setFieldValue('geometrics', renamed.geometrics);
    form.setFieldValue('scenes', renamed.scenes);
  }

  function handleDeleteMaterial(name: string) {
    const newMaterials = { ...renderConfig.materials };
    delete newMaterials[name];

    const newConfig: NormalizedRenderConfig = {
      ...renderConfig,
      materials: newMaterials,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('textures', fixed.textures);
  }

  // texture select items
  const textureItems = Object.keys(renderConfig.textures ?? {}).map((key) => ({
    label: key,
    value: key,
  }));

  function TextureSelects({ name }: { name: string }) {
    return (
      <>
        <form.AppField name={`materials.${name}.reflectance_texture`}>
          {(field) => <field.SelectControl label="Reflectance Texture" items={textureItems} />}
        </form.AppField>
        <form.AppField name={`materials.${name}.emittance_texture`}>
          {(field) => <field.SelectControl label="Emittance Texture" items={textureItems} />}
        </form.AppField>
      </>
    );
  }

  function renderControls(name: string) {
    const { data } = getMaterialData(renderConfig, name);

    switch (data.type) {
      case 'dielectric':
        return (
          <>
            <form.AppField name={`materials.${name}.index_of_refraction`}>
              {(field) => (
                <field.RangeControl label="Index of Refraction" min={1.0} max={10.0} step={0.01} />
              )}
            </form.AppField>
            <TextureSelects name={name} />
          </>
        );
      case 'lambertian':
        return <TextureSelects name={name} />;
      case 'specular':
        return (
          <>
            <form.AppField name={`materials.${name}.roughness`}>
              {(field) => <field.RangeControl label="Roughness" min={0.0} max={1.0} step={0.01} />}
            </form.AppField>
            <TextureSelects name={name} />
          </>
        );
    }
  }

  return (
    <ControlsCard
      leftLabel={materialName}
      onRename={handleRename}
      rightLabel={materialData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteMaterial(materialName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">{renderControls(materialName)}</div>
    </ControlsCard>
  );
}
