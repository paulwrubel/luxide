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
      // leaf geometrics and constant_volume have a 'material' field
      if ('material' in geo && typeof geo.material === 'string') {
        used.add(geo.material);
      }
    }
    return used;
  }, [geometricTree, renderConfig.geometrics]);

  const usedTextureNames = useMemo(() => {
    const used = new Set<string>();

    // from geometrics (constant_volume has reflectance_texture)
    for (const node of geometricTree) {
      if (!node.isUsedByActiveScene) {
        continue;
      }
      const geo = renderConfig.geometrics?.[node.formName];
      if (!geo) {
        continue;
      }
      if (geo.type === 'constant_volume' && 'reflectance_texture' in geo && typeof geo.reflectance_texture === 'string') {
        used.add(geo.reflectance_texture);
      }
    }

    // from used materials
    for (const matName of usedMaterialNames) {
      const mat = renderConfig.materials?.[matName];
      if (!mat) {
        continue;
      }
      if ('reflectance_texture' in mat && typeof mat.reflectance_texture === 'string') {
        used.add(mat.reflectance_texture);
      }
      if ('emittance_texture' in mat && typeof mat.emittance_texture === 'string') {
        used.add(mat.emittance_texture);
      }
    }

    return used;
  }, [geometricTree, usedMaterialNames, renderConfig.materials, renderConfig.geometrics]);

  const materialNames = useMemo(
    () => (section === 'materials' ? Object.keys(renderConfig.materials ?? {}) : []),
    [renderConfig, section],
  );

  const textureNames = useMemo(
    () => (section === 'textures' ? Object.keys(renderConfig.textures ?? {}) : []),
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
            <MaterialAccordionRow
              key={matName}
              form={form}
              materialName={matName}
              isUsedByActiveScene={usedMaterialNames.has(matName)}
            />
          ))}
        </div>
      )}

      {section === 'textures' && (
        <div className="flex flex-col">
          {textureNames.map((texName) => (
            <TextureAccordionRow
              key={texName}
              form={form}
              textureName={texName}
              isUsedByActiveScene={usedTextureNames.has(texName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
