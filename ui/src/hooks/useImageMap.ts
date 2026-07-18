import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useResourceImageUrl } from './useResourceImageUrl';

export function useImageMap(resourceId: number | undefined): THREE.Texture | null {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  const url = useResourceImageUrl(resourceId);

  useEffect(() => {
    if (!url) {
      return;
    }

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
  }, [url, resourceId]);

  return resourceId !== undefined ? map : null;
}
