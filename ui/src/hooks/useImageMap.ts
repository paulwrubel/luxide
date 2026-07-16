import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useResourceDataQuery } from './useResourceData';

export function useImageMap(resourceId: number | undefined): THREE.Texture | null {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  const { data: blob } = useResourceDataQuery(resourceId ?? 0, {
    enabled: resourceId !== undefined,
  });

  useEffect(() => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        setMap(texture);
      },
      undefined,
      () => {
        console.warn('Failed to load texture from resource', resourceId);
      },
    );

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob, resourceId]);

  return resourceId !== undefined ? map : null;
}
