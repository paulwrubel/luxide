import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export type SceneBackgroundProps = {
  color: [number, number, number];
};

export function SceneBackground(props: SceneBackgroundProps) {
  const { color } = props;

  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(...color);
  }, [scene, color]);
  return null;
}
