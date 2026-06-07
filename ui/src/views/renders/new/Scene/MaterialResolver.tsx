import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import { getCenterPoint } from '@/utils/render/geometric';
import { getGeometricDataSafe } from '@/utils/render/geometric';
import type { NormalizedRenderConfig } from '@/utils/render/config';

export type MaterialResolverProps = {
  config: NormalizedRenderConfig;
  materialRef: string;
  geometricName: string;
};

export function MaterialResolver(props: MaterialResolverProps) {
  const { config, materialRef, geometricName } = props;

  const { data: materialData } = getMaterialDataSafe(config, materialRef);
  const { data: reflectanceTexture } = getTextureDataSafe(config, materialData.reflectance_texture);
  const { data: emittanceTexture } = getTextureDataSafe(config, materialData.emittance_texture);

  const emissiveColor =
    emittanceTexture.type === 'color' && emittanceTexture.color.reduce((a, b) => a + b, 0) > 0
      ? emittanceTexture.color
      : undefined;

  const { data: geometricData } = getGeometricDataSafe(config, geometricName);

  // material
  let materialElement: React.ReactNode = null;

  if (materialData.type === 'dielectric') {
    console.warn('Dielectric material not yet supported');
  } else if (materialData.type === 'lambertian') {
    if (reflectanceTexture.type === 'color') {
      materialElement = (
        <meshLambertMaterial
          attach="material"
          color={reflectanceTexture.color}
          {...(emissiveColor ? { emissive: emissiveColor } : {})}
        />
      );
    } else if (reflectanceTexture.type === 'checker' || reflectanceTexture.type === 'image') {
      console.warn(`${reflectanceTexture.type} texture not yet supported for lambertian material`);
      materialElement = <meshLambertMaterial attach="material" color={[1, 1, 1]} />;
    }
  } else if (materialData.type === 'specular') {
    if (reflectanceTexture.type === 'color') {
      materialElement = (
        <meshStandardMaterial
          attach="material"
          color={reflectanceTexture.color}
          {...(emissiveColor ? { emissive: emissiveColor } : {})}
          metalness={1.0}
          roughness={materialData.roughness}
        />
      );
    } else if (reflectanceTexture.type === 'checker' || reflectanceTexture.type === 'image') {
      console.warn(`${reflectanceTexture.type} texture not yet supported for specular material`);
      materialElement = (
        <meshStandardMaterial
          attach="material"
          color={[1, 1, 1]}
          metalness={1.0}
          roughness={materialData.roughness}
        />
      );
    }
  }

  const shouldCreatePointLight = emissiveColor && geometricData.type !== 'constant_volume';

  return (
    <>
      {materialElement}
      {shouldCreatePointLight && (
        <pointLight
          position={getCenterPoint(config, geometricData)}
          intensity={Math.max(...emissiveColor)}
          color={emissiveColor}
          castShadow
        />
      )}
    </>
  );
}
