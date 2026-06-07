import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useSelector } from '@tanstack/react-store';
import { GeometricRenderer } from './GeometricRenderer';
import { CameraUpdater } from './CameraUpdater';
import { SceneBackground } from './SceneBackground';
import { getSceneData } from '@/utils/render/scene';
import { getCameraData } from '@/utils/render/camera';
import type { RenderForm } from '@/hooks/useRenderForm';

export type SceneProps = {
  form: RenderForm;
};

export function Scene(props: SceneProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
  const { data: cameraData } = getCameraData(renderConfig, activeScene.camera);

  return (
    <Canvas shadows="soft">
      <SceneBackground color={activeScene.background_color} />
      <CameraUpdater cameraData={cameraData} />
      <Environment preset="lobby" environmentIntensity={0.05} />
      {activeScene.geometrics.map((geoName: string) => (
        <GeometricRenderer key={geoName} config={renderConfig} name={geoName} />
      ))}
    </Canvas>
  );
}
