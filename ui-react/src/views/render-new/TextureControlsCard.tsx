import { useState } from 'react';
import { Card, Button } from 'flowbite-react';
import { ChevronDownIcon, ChevronUpIcon } from 'flowbite-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '../../components/Separator';
import TextInputControl from './ui/TextInputControl';
import TextArrayInputControl from './ui/TextArrayInputControl';
import InfoIconAdditionalInfo from './icons/InfoIconAdditionalInfo';
import NestedTextureHeader from './NestedTextureHeader';
import { getTextureData } from '../../utils/render/texture';
import { fixReferences } from '../../utils/render/utils';
import type { RenderConfig } from '../../utils/render/config';
import type { RenderForm } from '../../hooks/useRenderForm';
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

interface TextureControlsCardProps {
  form: RenderForm;
  textureName: string;
}

export default function TextureControlsCard({ form, textureName }: TextureControlsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const renderConfig = useStore(form.store, (state) => state.values);

  const { data: textureData } = getTextureData(renderConfig, textureName);

  function handleDeleteTexture(name: string) {
    const newTextures = { ...renderConfig.textures };
    delete newTextures[name];

    const newConfig: RenderConfig = {
      ...renderConfig,
      textures: newTextures,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('textures', fixed.textures);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
  }

  function SubTexture({ name }: { name: string }) {
    return (
      <>
        <NestedTextureHeader textureName={name} renderConfig={renderConfig} />
        {renderControls(name)}
      </>
    );
  }

  function renderControls(name: string) {
    const { data } = getTextureData(renderConfig, name);

    return (
      <>
        {data.type === 'checker' && (
          <>
            <TextInputControl
              form={form}
              field={`textures.${name}.scale`}
              label="Scale"
              valueLabel="scale"
              type="number"
            />
            <Separator />
            <SubTexture name={data.even_texture} />
            <Separator />
            <SubTexture name={data.odd_texture} />
          </>
        )}
        {data.type === 'image' && <p className="text-sm text-zinc-500">Image texture — TODO</p>}
        {data.type === 'color' && (
          <TextArrayInputControl
            form={form}
            field={`textures.${name}.color`}
            label="Color"
            valueLabels={['red', 'green', 'blue']}
            type="number"
            unenforcedStep={0.01}
            labelSuffix={
              <InfoIconAdditionalInfo
                info={[
                  'Color values are typically between 0 and 1. For example, pure white would be [1, 1, 1].',
                  'Values can be set outside of this range, and will be affected by the "Use Scaling Truncation" parameter.',
                  'In the case of emissive textures, these values linearly correspond to the intensity of the emitted light.',
                ]}
              />
            }
          />
        )}
      </>
    );
  }

  return (
    <Card className="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200 [&>div]:!p-0">
      <button
        type="button"
        className="flex items-center justify-between p-4 pr-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold">{textureName}</h2>
        <div className="flex flex-row items-center gap-2">
          <h3 className="text-lg font-light italic">{textureData.type}</h3>
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
              {renderControls(textureName)}
              <div className="flex w-full justify-end">
                <Button color="red" onClick={() => handleDeleteTexture(textureName)} size="sm">
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
