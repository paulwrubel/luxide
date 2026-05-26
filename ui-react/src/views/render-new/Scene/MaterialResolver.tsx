import { useMemo } from 'react';
import * as THREE from 'three';
import { getMaterialDataSafe } from '@/utils/render/material';
import { getTextureDataSafe } from '@/utils/render/texture';
import { isComposite, getCenterPoint } from '@/utils/render/geometric';
import { getGeometricDataSafe } from '@/utils/render/geometric';
import type { RenderConfig } from '@/utils/render/config';

interface MaterialResolverProps {
  config: RenderConfig;
  materialRef: string;
  geometricName: string;
}

export function MaterialResolver(props: MaterialResolverProps) {
  const { config, materialRef, geometricName } = props;

  const { data: materialData } = getMaterialDataSafe(config, materialRef);
  const { data: reflectanceTexture } = getTextureDataSafe(config, materialData.reflectance_texture);
  const { data: emittanceTexture } = getTextureDataSafe(config, materialData.emittance_texture);

  const emissiveColor =
    emittanceTexture.type === 'color' && emittanceTexture.color.reduce((a, b) => a + b, 0) > 0
      ? emittanceTexture.color
      : undefined;

  const emissive = useMemo(
    () => (emissiveColor ? new THREE.Color(...emissiveColor) : undefined),
    [emissiveColor],
  );

  // build material
  const material = useMemo(() => {
    if (materialData.type === 'dielectric') {
      console.warn('Dielectric material not yet supported');
      return null;
    }

    if (materialData.type === 'lambertian') {
      if (reflectanceTexture.type === 'color') {
        const mat = new THREE.MeshLambertMaterial({
          color: new THREE.Color(...reflectanceTexture.color),
        });
        if (emissive) {
          mat.emissive = emissive;
        }
        return mat;
      }
      if (reflectanceTexture.type === 'checker' || reflectanceTexture.type === 'image') {
        console.warn(
          `${reflectanceTexture.type} texture not yet supported for lambertian material`,
        );
        // fallback to white material if texture type not supported
        return new THREE.MeshLambertMaterial({ color: new THREE.Color(1, 1, 1) });
      }
      return null;
    }

    if (materialData.type === 'specular') {
      if (reflectanceTexture.type === 'color') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(...reflectanceTexture.color),
          emissive: emissiveColor ? new THREE.Color(...emissiveColor) : undefined,
          metalness: 1.0,
          roughness: materialData.roughness,
        });
      }
      if (reflectanceTexture.type === 'checker' || reflectanceTexture.type === 'image') {
        console.warn(`${reflectanceTexture.type} texture not yet supported for specular material`);
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(1, 1, 1),
          metalness: 1.0,
          roughness: materialData.roughness,
        });
      }
      return null;
    }

    return null;
  }, [materialData, reflectanceTexture, emissive, emissiveColor]);

  // emissive light
  const light = useMemo(() => {
    if (!emissiveColor) return null;

    const { data: geometricData } = getGeometricDataSafe(config, geometricName);
    if (isComposite(geometricData) || geometricData.type === 'constant_volume') return null;

    const center = getCenterPoint(config, geometricData);
    const intensity = emissiveColor.reduce((a, b) => a + b, 0) / 3;

    return (
      <pointLight
        position={center}
        intensity={intensity}
        color={new THREE.Color(...emissiveColor)}
        castShadow
      />
    );
  }, [emissiveColor, config, geometricName]);

  return (
    <>
      {material && <primitive object={material} attach="material" />}
      {light}
    </>
  );
}
