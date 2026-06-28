import { useSelector } from '@tanstack/react-store';
import { getSceneData } from '@/utils/render/scene';
import type { RenderForm } from '@/hooks/useRenderForm';
import { ScenePanel } from './ScenePanel';
import { CameraPanel } from './CameraPanel';

export type SceneControlsProps = {
  form: RenderForm;
};

export function SceneControls(props: SceneControlsProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);
  const activeScene = getSceneData(renderConfig, renderConfig.active_scene);

  return (
    <>
      <ScenePanel form={form} />
      <CameraPanel form={form} cameraName={activeScene.camera} />
    </>
  );
}
