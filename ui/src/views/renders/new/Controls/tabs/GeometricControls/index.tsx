import { useMemo, useState } from 'react';
import { useSelector } from '@tanstack/react-store';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getSceneData } from '@/utils/render/scene';
import { reorderRecordKeys } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';
import { DraggableGroup } from '../../shared/DraggableGroup';

import type { RenderForm } from '@/hooks/useRenderForm';
import { GeometricRow } from './GeometricRow';
import type { GeometricDisplayNode } from '../../shared/geometricTree';

export type GeometricControlsProps = {
  form: RenderForm;
};

export function GeometricControls(props: GeometricControlsProps) {
  const { form } = props;

  const renderConfig = useSelector(form.store, (state) => state.values);

  const geometricTree = useMemo(() => {
    const activeScene = getSceneData(renderConfig, renderConfig.active_scene);
    const sceneRoots = activeScene.geometrics;
    return buildGeometricTree(renderConfig.geometrics ?? {}, sceneRoots);
  }, [renderConfig]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const [activeID, setActiveId] = useState<string | null>(null);

  // build a lookup: parentID --> children
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, GeometricDisplayNode[]>();
    for (const node of geometricTree) {
      const key = node.parentID;
      const list = map.get(key);
      if (list) {
        list.push(node);
      } else {
        map.set(key, [node]);
      }
    }
    return map;
  }, [geometricTree]);

  // all root names (parentID === null), in insertion order
  const rootNames = useMemo(() => {
    return geometricTree.filter((n) => n.parentID === null).map((n) => n.formName);
  }, [geometricTree]);

  function handleDragEnd(event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = rootNames.indexOf(String(active.id));
    const newIndex = rootNames.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null);
      return;
    }

    const reorderedRoots = arrayMove([...rootNames], oldIndex, newIndex);

    // rebuild the geometrics record with roots in the new order,
    // non-root keys in their original insertion order
    const allKeys = Object.keys(renderConfig.geometrics ?? {});
    const rootNameSet = new Set(rootNames);
    const nonRootKeys = allKeys.filter((k) => !rootNameSet.has(k));
    const newKeyOrder = [...reorderedRoots, ...nonRootKeys];

    const reorderedGeometrics = reorderRecordKeys(renderConfig.geometrics ?? {}, newKeyOrder);
    form.setFieldValue('geometrics', reorderedGeometrics);
    setActiveId(null);
  }

  // recursive render: renders a node and all its descendants
  function renderNode(node: GeometricDisplayNode): React.ReactNode {
    const children = childrenByParent.get(node.formName) ?? [];
    const isRoot = node.parentID === null;

    const descendants = children.map((child) => renderNode(child));

    if (isRoot) {
      return (
        <DraggableGroup key={node.formName} id={node.formName}>
          <GeometricRow
            form={form}
            geometricName={node.formName}
            depth={node.depth}
            isUsedByActiveScene={node.isUsedByActiveScene}
            isDirectlyInActiveScene={node.isDirectlyInActiveScene}
          />
          {descendants}
        </DraggableGroup>
      );
    }

    return (
      <div key={node.formName}>
        <GeometricRow
          form={form}
          geometricName={node.formName}
          depth={node.depth}
          isUsedByActiveScene={node.isUsedByActiveScene}
          isDirectlyInActiveScene={node.isDirectlyInActiveScene}
        />
        {descendants}
      </div>
    );
  }

  const roots = childrenByParent.get(null) ?? [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        setActiveId(String(event.active.id));
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rootNames} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">{roots.map((node) => renderNode(node))}</div>
      </SortableContext>
      <DragOverlay>
        {activeID
          ? (() => {
              const node = geometricTree.find((n) => n.formName === activeID);
              if (!node) {
                return null;
              }
              const children = childrenByParent.get(node.formName) ?? [];
              return (
                <div>
                  <GeometricRow
                    form={form}
                    geometricName={node.formName}
                    depth={node.depth}
                    isUsedByActiveScene={node.isUsedByActiveScene}
                    isDirectlyInActiveScene={node.isDirectlyInActiveScene}
                  />
                  {children.map((child) => renderNode(child))}
                </div>
              );
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
