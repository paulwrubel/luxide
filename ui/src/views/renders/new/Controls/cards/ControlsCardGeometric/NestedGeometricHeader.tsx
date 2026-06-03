import { Separator } from '@/components/Separator';
import { getGeometricData } from '@/utils/render/geometric';
import type { NormalizedRenderConfig } from '@/utils/render/config';

interface NestedGeometricHeaderProps {
  geometricName: string;
  renderConfig: NormalizedRenderConfig;
}

export function NestedGeometricHeader(props: NestedGeometricHeaderProps) {
  const { geometricName, renderConfig } = props;

  const { data } = getGeometricData(renderConfig, geometricName);

  return (
    <div className="flex items-baseline justify-between">
      <p className="text-md font-light">Contained Geometric</p>
      <div className="text-md flex justify-stretch gap-2">
        <p className="text-md not-italic">{geometricName}</p>
        <Separator vertical />
        <p className="text-md font-light italic">{data.type}</p>
      </div>
    </div>
  );
}
