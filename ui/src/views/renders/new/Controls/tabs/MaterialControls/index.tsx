import { useMemo } from 'react';
import { useSelector } from '@tanstack/react-store';
import { getSceneData } from '@/utils/render/scene';
import { removeDefaults } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';

import type { RenderForm } from '@/hooks/useRenderForm';
import { MaterialRow } from './MaterialRow';

export function MaterialControls(props: { form: RenderForm }) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const geometricTree = useMemo(() => {
    const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
    const sceneRoots = removeDefaults(activeScene.geometrics);
    return buildGeometricTree(renderConfig.geometrics ?? {}, sceneRoots);
  }, [renderConfig]);

  const usedMaterialNames = useMemo(() => {
    const used = new Set<string>();
    for (const node of geometricTree) {
      if (!node.isUsedByActiveScene) {
        continue;
      }
      const geo = renderConfig.geometrics?.[node.formName];
      if (!geo) {
        continue;
      }
      if ('material' in geo && typeof geo.material === 'string') {
        used.add(geo.material);
      }
    }
    return used;
  }, [geometricTree, renderConfig.geometrics]);

  const materialNames = useMemo(
    () => Object.keys(renderConfig.materials ?? {}),
    [renderConfig.materials],
  );

  return (
    <div className="flex flex-col">
      {materialNames.map((matName) => (
        <MaterialRow
          key={matName}
          form={form}
          materialName={matName}
          isUsedByActiveScene={usedMaterialNames.has(matName)}
        />
      ))}
    </div>
  );
}
