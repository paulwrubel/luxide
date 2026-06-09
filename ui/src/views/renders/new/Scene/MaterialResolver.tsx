import { MeshTransmissionMaterial } from '@react-three/drei';
import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import type { NormalizedRenderConfig } from '@/utils/render/config';

export type MaterialResolverProps = {
  config: NormalizedRenderConfig;
  materialName: string;
};

export function MaterialResolver(props: MaterialResolverProps) {
  const { config, materialName } = props;

  const { data: materialData } = getMaterialDataSafe(config, materialName);
  const { data: reflectanceTexture } = getTextureDataSafe(config, materialData.reflectance_texture);
  const { data: emittanceTexture } = getTextureDataSafe(config, materialData.emittance_texture);

  const emissiveColor =
    emittanceTexture.type === 'color' && emittanceTexture.color.reduce((a, b) => a + b, 0) > 0
      ? emittanceTexture.color
      : undefined;

  switch (materialData.type) {
    case 'dielectric': {
      const ior = materialData.index_of_refraction || 1.5;
      switch (reflectanceTexture.type) {
        case 'color': {
          return (
            <MeshTransmissionMaterial
              attach="material"
              color={reflectanceTexture.color}
              thickness={0.5}
              transmission={1.0}
              ior={ior}
              roughness={0}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
            />
          );
        }
        case 'checker':
        case 'image': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for dielectric material`,
          );
          return (
            <MeshTransmissionMaterial
              attach="material"
              color={[1, 1, 1]}
              transmission={1.0}
              ior={ior}
              roughness={0}
            />
          );
        }
      }
    }
    // eslint-disable-next-line no-fallthrough -- all inner branches return, TS confirms exhaustive
    case 'lambertian': {
      switch (reflectanceTexture.type) {
        case 'color': {
          return (
            <meshLambertMaterial
              attach="material"
              color={reflectanceTexture.color}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
            />
          );
        }
        case 'checker':
        case 'image': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for lambertian material`,
          );
          return <meshLambertMaterial attach="material" color={[1, 1, 1]} />;
        }
      }
    }
    // eslint-disable-next-line no-fallthrough -- all inner branches return, TS confirms exhaustive
    case 'specular': {
      switch (reflectanceTexture.type) {
        case 'color': {
          return (
            <meshStandardMaterial
              attach="material"
              color={reflectanceTexture.color}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
        }
        case 'checker':
        case 'image': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for specular material`,
          );
          return (
            <meshStandardMaterial
              attach="material"
              color={[1, 1, 1]}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
        }
      }
    }
  }
}
