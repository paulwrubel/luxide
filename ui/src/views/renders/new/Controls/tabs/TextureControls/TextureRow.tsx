import { AccordionRow } from '../../shared/AccordionRow';
import { TextInputControl } from '@/components/form-controls/TextInputControl';
import { TextArrayInputControl } from '@/components/form-controls/TextArrayInputControl';
import { InfoIconAdditionalInfo } from '../../shared/icons/InfoIconAdditionalInfo';
import { getTextureData } from '@/utils/render/texture';
import { fixReferences, renameTexture } from '@/utils/render/utils';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import type { RenderForm } from '@/hooks/useRenderForm';
import { useSelector } from '@tanstack/react-store';
import { Separator } from '@/components/Separator';
import { WarningIconOrphanGeometric } from '../../shared/icons/WarningIconOrphanGeometric';
import { InfoIconDefaultEntity } from '../../shared/icons/InfoIconDefaultEntity';
import { DuplicateDropdown } from '../../shared/DuplicateDropdown';
import { duplicateTexture } from '@/utils/render/utils';
import { useAllResourceMetadataQuery } from '@/hooks/useResources';
import { ResourceImagePreview } from '@/components/ResourceImagePreview';

export type TextureRowProps = {
  form: RenderForm;
  textureName: string;
  isUsedByActiveScene: boolean;
};

export function TextureRow(props: TextureRowProps) {
  const { form, textureName, isUsedByActiveScene } = props;

  const { data: resources } = useAllResourceMetadataQuery();

  const isDefault = textureName.startsWith('__');

  const afterLabel = (
    <>
      {!isUsedByActiveScene && <WarningIconOrphanGeometric />}
      {isDefault && <InfoIconDefaultEntity />}
    </>
  );

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
      case 'image': {
        const resource = resources?.find((r) => r.id === data.resource_id);
        return (
          <div className="flex flex-col gap-1 text-sm text-zinc-400">
            <ResourceImagePreview resourceId={data.resource_id} />
            <div>
              <span className="text-zinc-500">Resource: </span>
              {resource ? resource.name : `#${data.resource_id}`}
            </div>
            <div>
              <span className="text-zinc-500">MIME: </span>
              {resource?.mime_type ?? 'unknown'}
            </div>
            <form.AppField name={`textures.${name}.gamma`}>
              {(field) => <field.RangeControl label="Gamma" min={0.1} max={2} step={0.01} />}
            </form.AppField>
          </div>
        );
      }
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
        return <h6 className="text-sm">Unimplemented texture (sorry!)</h6>;
    }
  }

  function handleDuplicate() {
    const result = duplicateTexture(renderConfig, textureName);
    form.setFieldValue('textures', result.textures);
  }

  return (
    <AccordionRow
      leftLabel={textureName}
      leftLabelStyle={isDefault ? 'light' : 'bold'}
      onRename={isDefault ? undefined : handleRename}
      rightLabel={textureData.type}
      rightLabelStyle="light"
      afterLabel={afterLabel}
      onDelete={isDefault ? undefined : () => handleDeleteTexture(textureName)}
      rightActions={!isDefault ? <DuplicateDropdown onDuplicate={handleDuplicate} /> : undefined}
    >
      <fieldset disabled={isDefault} className="border-0 p-0">
        <div className="flex w-full flex-col gap-2">{renderControls(textureName)}</div>
      </fieldset>
    </AccordionRow>
  );
}
