import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { useStore } from '@tanstack/react-form';
import * as THREE from 'three';
import { GeometricRenderer } from './GeometricRenderer';
import { getSceneData } from '../../../utils/render/scene';
import { getCameraData, type RawCameraData } from '../../../utils/render/camera';
import type { RenderForm } from '../../../hooks/useRenderForm';

interface SceneProps {
  form: RenderForm;
}

function CameraUpdater({ cameraData }: { cameraData: RawCameraData }) {
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

export function Scene(props: SceneProps) {
  const { form } = props;

  const renderConfig = useStore(form.store, (state) => state.values);
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
  const { data: cameraData } = getCameraData(renderConfig, activeScene.camera);

  return (
    <Canvas>
      <CameraUpdater cameraData={cameraData} />
      <ambientLight intensity={0.05} />
      {activeScene.geometrics.map((geoName: string) => (
        <GeometricRenderer key={geoName} config={renderConfig} name={geoName} />
      ))}
    </Canvas>
  );
}
