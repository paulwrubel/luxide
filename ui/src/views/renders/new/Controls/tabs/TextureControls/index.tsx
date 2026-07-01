import { useMemo, useState } from 'react';
import { useSelector } from '@tanstack/react-store';
import { getSceneData } from '@/utils/render/scene';
import { removeDefaults } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { reorderRecordKeys } from '@/utils/render/utils';

import type { RenderForm } from '@/hooks/useRenderForm';
import { TextureRow } from './TextureRow';
import { DraggableGroup } from '../../shared/DraggableGroup';

export function TextureControls(props: { form: RenderForm }) {
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
      if (
        geo.type === 'constant_volume' &&
        'reflectance_texture' in geo &&
        typeof geo.reflectance_texture === 'string'
      ) {
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

  const textureNames = useMemo(
    () => Object.keys(renderConfig.textures ?? {}),
    [renderConfig.textures],
  );

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const [activeID, setActiveId] = useState<string | null>(null);

  function handleDragEnd(event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = textureNames.indexOf(String(active.id));
    const newIndex = textureNames.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove([...textureNames], oldIndex, newIndex);
    const currentTextures = renderConfig.textures ?? {};
    const reorderedTextures = reorderRecordKeys(currentTextures, reordered);
    form.setFieldValue('textures', reorderedTextures);
    setActiveId(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(event) => { setActiveId(String(event.active.id)); }} onDragEnd={handleDragEnd}>
      <SortableContext items={textureNames} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {textureNames.map((texName) => (
            <DraggableGroup key={texName} id={texName}>
              <TextureRow
                form={form}
                textureName={texName}
                isUsedByActiveScene={usedTextureNames.has(texName)}
              />
            </DraggableGroup>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeID ? (
          <TextureRow
            form={form}
            textureName={activeID}
            isUsedByActiveScene={usedTextureNames.has(activeID)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
