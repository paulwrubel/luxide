import { useEffect, useRef } from 'react';
import { MeshTransmissionMaterial } from '@react-three/drei';
import type * as THREE from 'three';
import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import type { NormalizedRenderConfig } from '@/utils/render/config';
import { useImageMap } from '@/hooks/useImageMap';

export type MaterialResolverProps = {
  config: NormalizedRenderConfig;
  materialName: string;
  side?: THREE.Side;
  shadowSide?: THREE.Side;
};

export function MaterialResolver(props: MaterialResolverProps) {
  const { config, materialName, side, shadowSide } = props;

  const { data: materialData } = getMaterialDataSafe(config, materialName);
  const { data: reflectanceTexture } = getTextureDataSafe(config, materialData.reflectance_texture);
  const { data: emittanceTexture } = getTextureDataSafe(config, materialData.emittance_texture);
  const reflectanceImageMap = useImageMap(
    reflectanceTexture.type === 'image' ? reflectanceTexture.resource_id : undefined,
  );

  const lambertianMaterialRef = useRef<THREE.MeshLambertMaterial>(null);
  const dielectricMaterialRef = useRef<React.ComponentRef<typeof MeshTransmissionMaterial>>(null);
  const specularMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    const refs = [lambertianMaterialRef, dielectricMaterialRef, specularMaterialRef];
    for (const ref of refs) {
      if (ref.current) {
        ref.current.map = reflectanceImageMap;
        ref.current.needsUpdate = true;
      }
    }
  }, [reflectanceImageMap]);

  const emissiveColor =
    emittanceTexture.type === 'color' && emittanceTexture.color.reduce((a, b) => a + b, 0) > 0
      ? emittanceTexture.color
      : undefined;

  switch (materialData.type) {
    case 'dielectric': {
      const ior = materialData.index_of_refraction || 1.5;
      switch (reflectanceTexture.type) {
        case 'color': {
          const mediumData = materialData.medium_data;
          const hasHomogeneousMedium = mediumData?.type === 'homogeneous';
          return (
            <MeshTransmissionMaterial
              ref={dielectricMaterialRef}
              attach="material"
              color={reflectanceTexture.color}
              thickness={mediumData ? 0.5 : 0}
              transmission={1.0}
              ior={ior}
              roughness={0}
              side={side}
              shadowSide={shadowSide}
              {...(hasHomogeneousMedium
                ? {
                    attenuationColor: mediumData.transmittance,
                    attenuationDistance: mediumData.attenuation_distance,
                    emissive:
                      mediumData.emittance.reduce((a, b) => a + b, 0) > 0
                        ? mediumData.emittance
                        : undefined,
                  }
                : {})}
              {...(!hasHomogeneousMedium && emissiveColor ? { emissive: emissiveColor } : {})}
            />
          );
        }
        case 'checker': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for dielectric material`,
          );
          const mediumData = materialData.medium_data;
          const hasHomogeneousMedium = mediumData?.type === 'homogeneous';
          return (
            <MeshTransmissionMaterial
              ref={dielectricMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              thickness={mediumData ? 0.5 : 0}
              transmission={1.0}
              ior={ior}
              roughness={0}
              side={side}
              shadowSide={shadowSide}
              {...(hasHomogeneousMedium
                ? {
                    attenuationColor: mediumData.transmittance,
                    attenuationDistance: mediumData.attenuation_distance,
                    emissive:
                      mediumData.emittance.reduce((a, b) => a + b, 0) > 0
                        ? mediumData.emittance
                        : undefined,
                  }
                : {})}
            />
          );
        }
        case 'image': {
          const mediumData = materialData.medium_data;
          const hasHomogeneousMedium = mediumData?.type === 'homogeneous';
          return (
            <MeshTransmissionMaterial
              ref={dielectricMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              thickness={mediumData ? 0.5 : 0}
              transmission={1.0}
              ior={ior}
              roughness={0}
              side={side}
              shadowSide={shadowSide}
              {...(hasHomogeneousMedium
                ? {
                    attenuationColor: mediumData.transmittance,
                    attenuationDistance: mediumData.attenuation_distance,
                    emissive:
                      mediumData.emittance.reduce((a, b) => a + b, 0) > 0
                        ? mediumData.emittance
                        : undefined,
                  }
                : {})}
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
              ref={lambertianMaterialRef}
              attach="material"
              color={reflectanceTexture.color}
              side={side}
              shadowSide={shadowSide}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
            />
          );
        }
        case 'checker': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for lambertian material`,
          );
          return (
            <meshLambertMaterial
              ref={lambertianMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              side={side}
              shadowSide={shadowSide}
            />
          );
        }
        case 'image': {
          return (
            <meshLambertMaterial
              ref={lambertianMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              side={side}
              shadowSide={shadowSide}
            />
          );
        }
      }
    }
    // eslint-disable-next-line no-fallthrough -- all inner branches return, TS confirms exhaustive
    case 'specular': {
      switch (reflectanceTexture.type) {
        case 'color': {
          return (
            <meshStandardMaterial
              ref={specularMaterialRef}
              attach="material"
              color={reflectanceTexture.color}
              side={side}
              shadowSide={shadowSide}
              {...(emissiveColor ? { emissive: emissiveColor } : {})}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
        }
        case 'checker': {
          console.warn(
            `${reflectanceTexture.type} texture not yet supported for specular material`,
          );
          return (
            <meshStandardMaterial
              ref={specularMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              side={side}
              shadowSide={shadowSide}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
        }
        case 'image': {
          return (
            <meshStandardMaterial
              ref={specularMaterialRef}
              attach="material"
              color={[1, 1, 1]}
              side={side}
              shadowSide={shadowSide}
              metalness={1.0}
              roughness={materialData.roughness}
            />
          );
        }
      }
    }
  }
}
