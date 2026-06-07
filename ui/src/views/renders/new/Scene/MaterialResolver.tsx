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

  switch (materialData.type) {
    case 'dielectric': {
      console.warn('Dielectric material not yet supported');
      break;
    }
    case 'lambertian': {
      switch (reflectanceTexture.type) {
        case 'color': {
          materialElement = (
            <meshLambertMaterial
              attach="material"
              color={reflectanceTexture.color}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
            />
          );
          break;
        }
        case 'checker':
        case 'image': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for lambertian material`,
          );
          materialElement = <meshLambertMaterial attach="material" color={[1, 1, 1]} />;
          break;
        }
      }
      break;
    }
    case 'specular': {
      switch (reflectanceTexture.type) {
        case 'color': {
          materialElement = (
            <meshStandardMaterial
              attach="material"
              color={reflectanceTexture.color}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
          break;
        }
        case 'checker':
        case 'image': {
          console.warn(`${reflectanceTexture.type} texture not yet supported for specular material`);
          materialElement = (
            <meshStandardMaterial
              attach="material"
              color={[1, 1, 1]}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
          break;
        }
      }
      break;
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
