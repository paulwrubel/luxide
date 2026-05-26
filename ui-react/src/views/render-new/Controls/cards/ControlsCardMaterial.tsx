import { ControlsCard } from './ControlsCard';
import { RangeControl } from './form-controls/RangeControl';
import { SelectControl } from './form-controls/SelectControl';
import { getMaterialData } from '@/utils/render/material';
import { fixReferences } from '@/utils/render/utils';
import type { RenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

interface ControlsCardMaterialProps {
  form: RenderForm;
  materialName: string;
}

export function ControlsCardMaterial(props: ControlsCardMaterialProps) {
  const { form, materialName } = props;

  const renderConfig = useStore(form.store, (state) => state.values);

  const { data: materialData } = getMaterialData(renderConfig, materialName);

  function handleDeleteMaterial(name: string) {
    const newMaterials = { ...renderConfig.materials };
    delete newMaterials[name];

    const newConfig: RenderConfig = {
      ...renderConfig,
      materials: newMaterials,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('scenes', fixed.scenes);
    form.setFieldValue('textures', fixed.textures);
  }

  // Texture select items
  const textureItems = Object.keys(renderConfig.textures ?? {}).map((key) => ({
    name: key,
    value: key,
  }));

  function TextureSelects({ name }: { name: string }) {
    return (
      <>
        <SelectControl
          form={form}
          fieldName={`materials.${name}.reflectance_texture`}
          label="Reflectance Texture"
          items={textureItems}
        />
        <SelectControl
          form={form}
          fieldName={`materials.${name}.emittance_texture`}
          label="Emittance Texture"
          items={textureItems}
        />
      </>
    );
  }

  function renderControls(name: string) {
    const { data } = getMaterialData(renderConfig, name);

    switch (data.type) {
      case 'dielectric':
        return (
          <>
            <RangeControl
              form={form}
              fieldName={`materials.${name}.index_of_refraction`}
              label="Index of Refraction"
              min={1.0}
              max={10.0}
              step={0.01}
            />
            <TextureSelects name={name} />
          </>
        );
      case 'lambertian':
        return <TextureSelects name={name} />;
      case 'specular':
        return (
          <>
            <RangeControl
              form={form}
              fieldName={`materials.${name}.roughness`}
              label="Roughness"
              min={0.0}
              max={1.0}
              step={0.01}
            />
            <TextureSelects name={name} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <ControlsCard
      leftLabel={materialName}
      rightLabel={materialData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteMaterial(materialName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">{renderControls(materialName)}</div>
    </ControlsCard>
  );
}
