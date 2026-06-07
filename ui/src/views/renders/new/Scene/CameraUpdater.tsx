import { PerspectiveCamera } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { RawCameraData } from '@/utils/render/camera';

export type CameraUpdaterProps = {
  cameraData: RawCameraData;
};

export function CameraUpdater(props: CameraUpdaterProps) {
  const { cameraData } = props;

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // imperative: lookAt is a method, not a reactive prop
  useEffect(() => {
    cameraRef.current?.lookAt(
      cameraData.target_location[0],
      cameraData.target_location[1],
      cameraData.target_location[2],
    );
  }, [cameraData]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={cameraData.vertical_field_of_view_degrees}
      position={cameraData.eye_location}
      up={cameraData.view_up}
    />
  );
}
