import { Separator } from '@/components/Separator';
import { getTextureData } from '@/utils/render/texture';
import type { NormalizedRenderConfig } from '@/utils/render/config';

interface NestedTextureHeaderProps {
  textureName: string;
  renderConfig: NormalizedRenderConfig;
}

export function NestedTextureHeader(props: NestedTextureHeaderProps) {
  const { textureName, renderConfig } = props;

  const { data } = getTextureData(renderConfig, textureName);

  return (
    <div className="flex justify-between">
      <h2 className="text-lg font-bold italic">Contained Texture</h2>
      <div className="flex gap-2">
        <h3 className="text-lg font-light not-italic">{textureName}</h3>
        <Separator vertical />
        <h3 className="text-lg font-light italic">{data.type}</h3>
      </div>
    </div>
  );
}
