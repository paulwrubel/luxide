import { useMemo, useState } from 'react';
import { useSelector } from '@tanstack/react-store';
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
import { getSceneData } from '@/utils/render/scene';
import { removeDefaults, reorderRecordKeys } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';

import type { RenderForm } from '@/hooks/useRenderForm';
import { DraggableGroup } from '../../shared/DraggableGroup';
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

    const oldIndex = materialNames.indexOf(String(active.id));
    const newIndex = materialNames.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove([...materialNames], oldIndex, newIndex);
    const currentMaterials = renderConfig.materials ?? {};
    const reorderedMaterials = reorderRecordKeys(currentMaterials, reordered);
    form.setFieldValue('materials', reorderedMaterials);
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        setActiveId(String(event.active.id));
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={materialNames} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {materialNames.map((matName) => (
            <DraggableGroup key={matName} id={matName}>
              <MaterialRow
                form={form}
                materialName={matName}
                isUsedByActiveScene={usedMaterialNames.has(matName)}
              />
            </DraggableGroup>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeID ? (
          <MaterialRow
            form={form}
            materialName={activeID}
            isUsedByActiveScene={usedMaterialNames.has(activeID)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
