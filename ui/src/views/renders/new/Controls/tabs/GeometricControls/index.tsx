import { useMemo, useState, useCallback } from 'react';
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
import type { CollisionDetection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getSceneData } from '@/utils/render/scene';
import { reorderRecordKeys } from '@/utils/render/utils';
import { buildGeometricTree } from '../../shared/geometricTree';
import { DraggableGroup } from '../../shared/DraggableGroup';

import type { RenderForm } from '@/hooks/useRenderForm';
import { GeometricRow } from './GeometricRow';
import type { GeometricDisplayNode } from '../../shared/geometricTree';

// iD prefixes for the flat sortable model
const ROOT_PREFIX = 'root:';
const LIST_PREFIX = 'list:';

function makeRootID(name: string): string {
  return ROOT_PREFIX + name;
}

function makeListChildID(parentName: string, childName: string): string {
  return LIST_PREFIX + parentName + ':' + childName;
}

function parseRootID(id: string): string | null {
  if (!id.startsWith(ROOT_PREFIX)) {
    return null;
  }
  return id.slice(ROOT_PREFIX.length);
}

function parseListChildID(id: string): { parentName: string; childName: string } | null {
  if (!id.startsWith(LIST_PREFIX)) {
    return null;
  }
  const rest = id.slice(LIST_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon === -1) {
    return null;
  }
  return { parentName: rest.slice(0, colon), childName: rest.slice(colon + 1) };
}

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

  const [activeID, setActiveID] = useState<string | null>(null);

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

  // all sortable item IDs for the single SortableContext
  const allSortableIDs = useMemo(() => {
    const ids: string[] = [];

    for (const name of rootNames) {
      ids.push(makeRootID(name));
    }

    // collect list child IDs grouped by parent
    for (const node of geometricTree) {
      if (node.type === 'list') {
        const children = childrenByParent.get(node.formName) ?? [];
        for (const child of children) {
          ids.push(makeListChildID(node.formName, child.formName));
        }
      }
    }

    return ids;
  }, [rootNames, geometricTree, childrenByParent]);

  // custom collision detection: only allow items from the same group
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const activeIDStr = String(args.active.id);
    const activePrefix = activeIDStr.startsWith(ROOT_PREFIX)
      ? ROOT_PREFIX
      : activeIDStr.substring(0, activeIDStr.lastIndexOf(':') + 1);

    const filtered = args.droppableContainers.filter((c) => {
      const cid = String(c.id);
      if (activePrefix === ROOT_PREFIX) {
        return cid.startsWith(ROOT_PREFIX);
      }
      return cid.startsWith(activePrefix);
    });

    return closestCenter({
      ...args,
      droppableContainers: filtered,
    });
  }, []);

  function handleDragEnd(event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveID(null);
      return;
    }

    const activeIDStr = String(active.id);
    const overIDStr = String(over.id);

    // route by prefix
    if (activeIDStr.startsWith(LIST_PREFIX)) {
      const activeParsed = parseListChildID(activeIDStr);
      const overParsed = parseListChildID(overIDStr);
      if (!activeParsed || !overParsed) {
        setActiveID(null);
        return;
      }
      if (activeParsed.parentName !== overParsed.parentName) {
        setActiveID(null);
        return;
      }

      const listName = activeParsed.parentName;
      const listGeo = renderConfig.geometrics?.[listName];
      if (listGeo?.type !== 'list') {
        setActiveID(null);
        return;
      }

      const children = childrenByParent.get(listName) ?? [];
      const childNames = children.map((c) => c.formName);
      const oldIdx = childNames.indexOf(activeParsed.childName);
      const newIdx = childNames.indexOf(overParsed.childName);
      if (oldIdx === -1 || newIdx === -1) {
        setActiveID(null);
        return;
      }

      const reordered = arrayMove([...childNames], oldIdx, newIdx);
      form.setFieldValue('geometrics', {
        ...renderConfig.geometrics,
        [listName]: { ...listGeo, geometrics: reordered },
      });
      setActiveID(null);
      return;
    }

    // scene roots
    const activeName = parseRootID(activeIDStr);
    const overName = parseRootID(overIDStr);
    if (!activeName || !overName) {
      setActiveID(null);
      return;
    }

    const oldIndex = rootNames.indexOf(activeName);
    const newIndex = rootNames.indexOf(overName);
    if (oldIndex === -1 || newIndex === -1) {
      setActiveID(null);
      return;
    }

    const reorderedRoots = arrayMove([...rootNames], oldIndex, newIndex);

    const allKeys = Object.keys(renderConfig.geometrics ?? {});
    const rootNameSet = new Set(rootNames);
    const nonRootKeys = allKeys.filter((k) => !rootNameSet.has(k));
    const newKeyOrder = [...reorderedRoots, ...nonRootKeys];

    const reorderedGeometrics = reorderRecordKeys(renderConfig.geometrics ?? {}, newKeyOrder);
    form.setFieldValue('geometrics', reorderedGeometrics);
    setActiveID(null);
  }

  // renders a node and its descendants recursively.
  // parentIsList: true when the direct parent is a list (children get DraggableGroup).
  function renderNode(node: GeometricDisplayNode, parentIsList: boolean): React.ReactNode {
    const children = childrenByParent.get(node.formName) ?? [];
    const isRoot = node.parentID === null;
    const isList = node.type === 'list';
    const nextIsList = isList;

    const grandchildren = children.map((child) => renderNode(child, nextIsList));

    if (isRoot) {
      // root always gets a DraggableGroup. list children are rendered as flat siblings
      // by the parent (see the root list rendering below), not nested inside.
      return (
        <DraggableGroup key={node.formName} id={makeRootID(node.formName)} depth={node.depth}>
          <GeometricRow
            form={form}
            geometricName={node.formName}
            depth={0}
            isUsedByActiveScene={node.isUsedByActiveScene}
            isDirectlyInActiveScene={node.isDirectlyInActiveScene}
          />
          {grandchildren}
        </DraggableGroup>
      );
    }

    if (parentIsList) {
      // list child — gets its own DraggableGroup for reordering.
      // rendered as a flat sibling by the parent list root.
      return (
        <DraggableGroup
          key={node.formName}
          id={makeListChildID(node.parentID!, node.formName)}
          depth={1}
        >
          <GeometricRow
            form={form}
            geometricName={node.formName}
            depth={0}
            isUsedByActiveScene={node.isUsedByActiveScene}
            isDirectlyInActiveScene={node.isDirectlyInActiveScene}
          />
          {grandchildren}
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
        {grandchildren}
      </div>
    );
  }

  const roots = childrenByParent.get(null) ?? [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={(event) => {
        setActiveID(String(event.active.id));
      }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allSortableIDs} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">{roots.map((node) => renderNode(node, false))}</div>
      </SortableContext>
      <DragOverlay>
        {activeID
          ? (() => {
              // strip prefix to get geometric name
              const geoName =
                parseRootID(activeID) ?? parseListChildID(activeID)?.childName ?? null;
              if (!geoName) {
                return null;
              }
              const node = geometricTree.find((n) => n.formName === geoName);
              if (!node) {
                return null;
              }
              const childNodes = childrenByParent.get(node.formName) ?? [];
              return (
                <div>
                  <GeometricRow
                    form={form}
                    geometricName={node.formName}
                    depth={node.depth}
                    isUsedByActiveScene={node.isUsedByActiveScene}
                    isDirectlyInActiveScene={node.isDirectlyInActiveScene}
                  />
                  {childNodes.map((child) => renderNode(child, false))}
                </div>
              );
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
