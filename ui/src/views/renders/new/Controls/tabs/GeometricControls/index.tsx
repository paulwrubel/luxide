import { useMemo } from 'react';
import { useSelector } from '@tanstack/react-store';
import { getSceneData } from '@/utils/render/scene';
import { removeDefaults } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';

import type { RenderForm } from '@/hooks/useRenderForm';
import { GeometricRow } from './GeometricRow';

export type GeometricControlsProps = {
  form: RenderForm;
};

export function GeometricControls(props: GeometricControlsProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const geometricTree = useMemo(() => {
    const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
    const sceneRoots = removeDefaults(activeScene.geometrics);
    return buildGeometricTree(renderConfig.geometrics ?? {}, sceneRoots);
  }, [renderConfig]);

  return (
    <div className="flex flex-col">
      {geometricTree.map((node) => (
        <GeometricRow
          key={node.formName + '-' + node.depth}
          form={form}
          geometricName={node.formName}
          depth={node.depth}
          isUsedByActiveScene={node.isUsedByActiveScene}
          isDirectlyInActiveScene={node.isDirectlyInActiveScene}
        />
      ))}
    </div>
  );
}
