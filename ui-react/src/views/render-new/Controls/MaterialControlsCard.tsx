import { useState } from 'react';
import { Card, Button } from 'flowbite-react';
import { ChevronDownIcon, ChevronUpIcon } from 'flowbite-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '../../../components/Separator';
import { RangeControl } from './form-controls/RangeControl';
import { SelectControl } from './form-controls/SelectControl';
import { getMaterialData } from '../../../utils/render/material';
import { fixReferences } from '../../../utils/render/utils';
import type { RenderConfig } from '../../../utils/render/config';
import type { RenderForm } from '../../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

interface MaterialControlsCardProps {
  form: RenderForm;
  materialName: string;
}

export function MaterialControlsCard(props: MaterialControlsCardProps) {
  const { form, materialName } = props;

  const [isExpanded, setIsExpanded] = useState(false);
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
          field={`materials.${name}.reflectance_texture`}
          label="Reflectance Texture"
          items={textureItems}
        />
        <SelectControl
          form={form}
          field={`materials.${name}.emittance_texture`}
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
              field={`materials.${name}.index_of_refraction`}
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
              field={`materials.${name}.roughness`}
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
    <Card className="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200 [&>div]:!p-0">
      <button
        type="button"
        className="flex items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold">{materialName}</h2>
        <div className="flex flex-row items-center gap-2">
          <h3 className="text-lg font-light italic">{materialData.type}</h3>
          {isExpanded ? (
            <ChevronUpIcon className="h-8 w-auto" />
          ) : (
            <ChevronDownIcon className="h-8 w-auto" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="flex flex-col gap-2 p-4">
              {renderControls(materialName)}
              <div className="flex w-full justify-end">
                <Button color="red" onClick={() => handleDeleteMaterial(materialName)} size="sm">
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
