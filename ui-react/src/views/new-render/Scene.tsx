import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import GeometricRenderer from './GeometricRenderer';
import { getSceneData } from '../../utils/render/scene';
import { getCameraData } from '../../utils/render/camera';
import type { RenderConfig } from '../../utils/render/config';

function SceneCamera({ cameraData }: { cameraData: any }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(
        cameraData.target_location[0],
        cameraData.target_location[1],
        cameraData.target_location[2]
      );
    }
  }, [cameraData.target_location]);

  return (
    <perspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={cameraData.vertical_field_of_view_degrees}
      position={cameraData.eye_location}
      up={cameraData.view_up}
    />
  );
}

interface SceneProps {
  form: any;
}

export default function Scene({ form }: SceneProps) {
  const renderConfig = form.state.values as RenderConfig;
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
  const { data: cameraData } = getCameraData(renderConfig, activeScene.camera);

  return (
    <Canvas>
      <SceneCamera cameraData={cameraData} />
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
