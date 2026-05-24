import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { useStore } from '@tanstack/react-form';
import * as THREE from 'three';
import GeometricRenderer from './GeometricRenderer';
import { getSceneData } from '../../utils/render/scene';
import { getCameraData } from '../../utils/render/camera';
import type { RenderConfig } from '../../utils/render/config';

interface SceneProps {
  form: any;
}

function CameraUpdater({ cameraData }: { cameraData: any }) {
  const { camera } = useThree();
  const needsUpdate = useRef(true);

  useEffect(() => {
    needsUpdate.current = true;
  }, [cameraData]);

  useFrame(() => {
    if (!needsUpdate.current) return;
    if (!('isPerspectiveCamera' in camera)) return;

    (camera as THREE.PerspectiveCamera).fov =
      cameraData.vertical_field_of_view_degrees;
    camera.position.set(
      cameraData.eye_location[0],
      cameraData.eye_location[1],
      cameraData.eye_location[2]
    );
    camera.up.set(
      cameraData.view_up[0],
      cameraData.view_up[1],
      cameraData.view_up[2]
    );
    camera.lookAt(
      cameraData.target_location[0],
      cameraData.target_location[1],
      cameraData.target_location[2]
    );
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    needsUpdate.current = false;
  });

  return null;
}

export default function Scene({ form }: SceneProps) {
  const renderConfig = useStore(
    form.store,
    (state: any) => state.values
  ) as RenderConfig;
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
  const { data: cameraData } = getCameraData(renderConfig, activeScene.camera);

  return (
    <Canvas>
      <CameraUpdater cameraData={cameraData} />
      <ambientLight intensity={0.05} />
      {activeScene.geometrics.map((geoName: string) => (
        <GeometricRenderer
          key={geoName}
          config={renderConfig}
          name={geoName}
        />
      ))}
    </Canvas>
  );
}
