import { Separator } from '../../components/Separator';
import { getGeometricData } from '../../utils/render/geometric';
import type { RenderConfig } from '../../utils/render/config';

interface NestedGeometricHeaderProps {
  geometricName: string;
  renderConfig: RenderConfig;
}

export function NestedGeometricHeader(props: NestedGeometricHeaderProps) {
  const { geometricName, renderConfig } = props;

  const { data } = getGeometricData(renderConfig, geometricName);

  return (
    <div className="flex justify-between">
      <h2 className="text-lg font-bold italic">Contained Geometric</h2>
      <div className="flex gap-2">
        <h3 className="text-lg font-light not-italic">{geometricName}</h3>
        <Separator vertical />
        <h3 className="text-lg font-light italic">{data.type}</h3>
      </div>
    </div>
  );
}
