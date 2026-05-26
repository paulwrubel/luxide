import { ControlsCard } from '../ControlsCard';
import { TextInputControl } from '../form-controls/TextInputControl';
import { TextArrayInputControl } from '../form-controls/TextArrayInputControl';
import { InfoIconAdditionalInfo } from '../../icons/InfoIconAdditionalInfo';
import { NestedTextureHeader } from './NestedTextureHeader';
import { getTextureData } from '../../../../../utils/render/texture';
import { fixReferences } from '../../../../../utils/render/utils';
import type { RenderConfig } from '../../../../../utils/render/config';
import type { RenderForm } from '../../../../../hooks/useRenderForm';
import { useStore } from '@tanstack/react-form';
import { Separator } from '../../../../../components/Separator';

interface ControlsCardTextureProps {
  form: RenderForm;
  textureName: string;
}

export function ControlsCardTexture(props: ControlsCardTextureProps) {
  const { form, textureName } = props;

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
              fieldName={`textures.${name}.scale`}
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
        )}
      </>
    );
  }

  return (
    <ControlsCard
      leftLabel={textureName}
      rightLabel={textureData.type}
      rightLabelStyle="light"
      onDelete={() => handleDeleteTexture(textureName)}
    >
      <div className="flex w-full flex-col gap-2 p-4">{renderControls(textureName)}</div>
    </ControlsCard>
  );
}
