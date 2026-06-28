import { AccordionRow } from '../AccordionRow';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { InfoIconAdditionalInfo } from '@/views/renders/new/Controls/icons/InfoIconAdditionalInfo';
import { getTextureData } from '@/utils/render/texture';
import { fixReferences, renameTexture } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { Separator } from '@/components/Separator';

export type TextureAccordionRowProps = {
  form: RenderForm;
  textureName: string;
};

export function TextureAccordionRow(props: TextureAccordionRowProps) {
  const { form, textureName } = props;

  const isDefault = textureName.startsWith('__');

  const renderConfig = useSelector(form.store, (state) => state.values);

  const { data: textureData } = getTextureData(renderConfig, textureName);

  function handleRename(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === textureName) {
      return;
    }

    const renamed = renameTexture(renderConfig, textureName, trimmed);

    form.setFieldValue('textures', renamed.textures);
    form.setFieldValue('materials', renamed.materials);
    form.setFieldValue('geometrics', renamed.geometrics);
    form.setFieldValue('scenes', renamed.scenes);
  }

  function handleDeleteTexture(name: string) {
    const newTextures = { ...renderConfig.textures };
    delete newTextures[name];

    const newConfig: NormalizedRenderConfig = {
      ...renderConfig,
      textures: newTextures,
    };

    const fixed = fixReferences(newConfig);
    form.setFieldValue('textures', fixed.textures);
    form.setFieldValue('materials', fixed.materials);
    form.setFieldValue('geometrics', fixed.geometrics);
    form.setFieldValue('scenes', fixed.scenes);
  }

  function renderControls(name: string) {
    const { data } = getTextureData(renderConfig, name);

    switch (data.type) {
      case 'checker': {
        const evenData = getTextureData(renderConfig, data.even_texture);
        const oddData = getTextureData(renderConfig, data.odd_texture);

        return (
          <>
            <TextInputControl
              form={form}
              fieldName={`textures.${name}.scale`}
              label="Scale"
              valueLabel="scale"
              type="number"
            />
            <Separator />
            <div className="flex items-baseline justify-between py-1">
              <span className="text-sm text-zinc-400">Even Texture:</span>
              <span className="text-sm">
                {data.even_texture}{' '}
                <span className="text-zinc-500 italic">{evenData.data.type}</span>
              </span>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between py-1">
              <span className="text-sm text-zinc-400">Odd Texture:</span>
              <span className="text-sm">
                {data.odd_texture} <span className="text-zinc-500 italic">{oddData.data.type}</span>
              </span>
            </div>
          </>
        );
      }
      // case 'image': {
      //   return <p className="text-sm text-zinc-500">Image texture — TODO</p>;
      // }
      case 'color': {
        return (
          <TextArrayInputControl
            form={form}
            fieldName={`textures.${name}.color`}
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
        );
      }
      default:
        return <h6 className="text-sm">Unimplemented texture: {data.type} (sorry!)</h6>;
    }
  }

  return (
    <AccordionRow
      leftLabel={textureName}
      leftLabelStyle={isDefault ? 'light' : 'bold'}
      onRename={isDefault ? undefined : handleRename}
      rightLabel={textureData.type}
      rightLabelStyle="light"
      onDelete={isDefault ? undefined : () => handleDeleteTexture(textureName)}
      isDefaultEntity={isDefault}
    >
      <fieldset disabled={isDefault} className="border-0 p-0">
        <div className="flex w-full flex-col gap-2">{renderControls(textureName)}</div>
      </fieldset>
    </AccordionRow>
  );
}
