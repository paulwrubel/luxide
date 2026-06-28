import { useMemo } from 'react';
import { useSelector } from '@tanstack/react-store';
import { getSceneData } from '@/utils/render/scene';
import { removeDefaults } from '@/utils/render/utils';
import { buildGeometricTree } from './geometricTree';

import type { RenderForm } from '@/hooks/useRenderForm';
import { GeometricAccordionRow } from './GeometricAccordionRow';
import { MaterialAccordionRow } from './MaterialAccordionRow';
import { TextureAccordionRow } from './TextureAccordionRow';

export type AccordionViewProps = {
  form: RenderForm;
  section: 'geometrics' | 'materials' | 'textures';
};

export function AccordionView(props: AccordionViewProps) {
  const { form, section } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const geometricTree = useMemo(() => {
    if (section !== 'geometrics') {
      return [];
    }
    const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
    const sceneRoots = removeDefaults(activeScene.geometrics);
    return buildGeometricTree(renderConfig.geometrics ?? {}, sceneRoots);
  }, [renderConfig, section]);

  const materialNames = useMemo(
    () => section === 'materials' ? Object.keys(renderConfig.materials ?? {}) : [],
    [renderConfig, section],
  );

  const textureNames = useMemo(
    () => section === 'textures' ? Object.keys(renderConfig.textures ?? {}) : [],
    [renderConfig, section],
  );

  return (
    <div className="flex flex-col gap-6">
      {section === 'geometrics' && (
        <div className="flex flex-col">
          {geometricTree.map((node) => (
            <GeometricAccordionRow
              key={node.formName + '-' + node.depth}
              form={form}
              geometricName={node.formName}
              depth={node.depth}
              isUsedByActiveScene={node.isUsedByActiveScene}
              isDirectlyInActiveScene={node.isDirectlyInActiveScene}
            />
          ))}
        </div>
      )}

      {section === 'materials' && (
        <div className="flex flex-col">
          {materialNames.map((matName) => (
            <MaterialAccordionRow key={matName} form={form} materialName={matName} />
          ))}
        </div>
      )}

      {section === 'textures' && (
        <div className="flex flex-col">
          {textureNames.map((texName) => (
            <TextureAccordionRow key={texName} form={form} textureName={texName} />
          ))}
        </div>
      )}
    </div>
  );
}
