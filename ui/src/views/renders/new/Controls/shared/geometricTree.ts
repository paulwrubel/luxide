import type { NormalizedGeometricData } from '@/utils/render/geometric';

export type GeometricDisplayNode = {
  formName: string;
  displayName: string;
  type: string;
  depth: number;
  parentID: string | null;
  isDirectlyInActiveScene: boolean;
  isUsedByActiveScene: boolean;
};

// returns the child geometric names referenced by a geometric,
// or an empty array if it has no children (leaf type).
function getChildGeometricNames(geo: NormalizedGeometricData): string[] {
  switch (geo.type) {
    case 'box':
    case 'bilinear_patch':
    case 'cylinder':
    case 'disk':
    case 'obj_model':
    case 'parallelogram':
    case 'plane':
    case 'sphere':
    case 'triangle':
      return [];
    case 'rotate_x':
    case 'rotate_y':
    case 'rotate_z':
    case 'rotate_quaternion':
    case 'scale':
    case 'translate':
    case 'constant_volume':
    case 'virtual':
      return [geo.geometric];
    case 'list':
      return geo.geometrics;
  }
}

export function buildGeometricTree(
  geometrics: Record<string, NormalizedGeometricData>,
  sceneRoots: string[],
): GeometricDisplayNode[] {
  const result: GeometricDisplayNode[] = [];
  const visitedInTree = new Set<string>();
  const activeSceneNames = new Set(sceneRoots);

  // pass 1: find child names — any name referenced via geometric/geometrics fields
  const childNames = new Set<string>();
  for (const geo of Object.values(geometrics)) {
    for (const childName of getChildGeometricNames(geo)) {
      childNames.add(childName);
    }
  }

  // true roots: geometrics that are NOT children of anything, in IndexMap insertion order
  const rootNames = Object.keys(geometrics).filter((name) => !childNames.has(name));

  // pass 2+3: DFS from true roots, propagating scene usage down the tree
  function dfs(
    name: string,
    depth: number,
    parentID: string | null,
    ancestors: Set<string>,
    isAncestorUsed: boolean,
  ): void {
    // cycle detected - skip this branch entirely
    if (ancestors.has(name)) {
      return;
    }

    const geo = geometrics[name];
    // referenced but not in the record — skip gracefully
    if (!geo) {
      return;
    }

    const isDirect = activeSceneNames.has(name);
    const isUsed = isDirect || isAncestorUsed;

    visitedInTree.add(name);
    result.push({
      formName: name,
      displayName: name,
      type: geo.type,
      depth,
      parentID,
      isDirectlyInActiveScene: isDirect,
      isUsedByActiveScene: isUsed,
    });

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(name);

    for (const childName of getChildGeometricNames(geo)) {
      dfs(childName, depth + 1, name, nextAncestors, isUsed);
    }
  }

  for (const rootName of rootNames) {
    dfs(rootName, 0, null, new Set(), false);
  }

  // pass 4: safety-net orphans (shouldn't happen with structural roots, but defensive)
  const orphanKeys = Object.keys(geometrics).filter((key) => !visitedInTree.has(key));

  for (const orphanName of orphanKeys) {
    const geo = geometrics[orphanName];
    const isDirect = activeSceneNames.has(orphanName);
    result.push({
      formName: orphanName,
      displayName: orphanName,
      type: geo.type,
      depth: 0,
      parentID: null,
      isDirectlyInActiveScene: isDirect,
      isUsedByActiveScene: isDirect,
    });
  }

  return result;
}
