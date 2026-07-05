import { degreesToRadians, radiansToDegrees } from '../math';
import { z } from 'zod';
import type { NormalizedRenderConfig } from './config';

export function removeDefaults(array: string[]) {
  return array.filter((item) => !item.startsWith('__'));
}

export function getTopLevelGeometricNames(config: NormalizedRenderConfig) {
  return Object.keys(config.geometrics ?? {}).filter(
    (name) =>
      !Object.values(config.geometrics ?? {})
        .flatMap((data) => {
          switch (data.type) {
            case 'list':
              return data.geometrics;
            case 'rotate_x':
            case 'rotate_y':
            case 'rotate_z':
            case 'translate':
            case 'constant_volume':
            case 'virtual':
              return data.geometric;
            default:
              return [];
          }
        })
        .includes(name),
  );
}

export function getTopLevelMaterialNames(config: NormalizedRenderConfig) {
  return Object.keys(config.materials ?? {});
}

export function getTopLevelTextureNames(config: NormalizedRenderConfig) {
  return Object.keys(config.textures ?? {}).filter(
    (name) =>
      !Object.values(config.textures ?? {})
        .flatMap((data) => {
          switch (data.type) {
            case 'checker':
              return [data.even_texture, data.odd_texture];
            default:
              return [];
          }
        })
        .includes(name),
  );
}

export function isNonNullObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export function isTypedObject(x: unknown): x is Record<string, unknown> & { type: string } {
  return isNonNullObject(x) && 'type' in x && typeof x.type === 'string';
}

export function getNextUniqueName<_T>(collection: Record<string, _T>, baseName: string): string {
  let name = baseName;
  for (let i = 2; name in collection; i++) {
    name = `${baseName}${i}`;
  }
  return name;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const AngleDegreesSchema = z.object({
  degrees: z.number(),
});

export const AngleRadiansSchema = z.object({
  radians: z.number(),
});

export const AngleSchema = z.union([AngleDegreesSchema, AngleRadiansSchema]);

export type Angle = z.infer<typeof AngleSchema>;

export function toRadians(angle: Angle): number {
  if ('degrees' in angle) {
    return degreesToRadians(angle.degrees);
  }
  return angle.radians;
}

export function toDegrees(angle: Angle): number {
  if ('radians' in angle) {
    return radiansToDegrees(angle.radians);
  }
  return angle.degrees;
}

export type Around = AroundCenter | AroundOrigin | AroundPoint;

export type AroundCenter = 'center';
export type AroundOrigin = 'origin';
export type AroundPoint = { point: [number, number, number] };

export function isAroundCenter(around: Around): around is AroundCenter {
  return around === 'center';
}
export function isAroundOrigin(around: Around): around is AroundOrigin {
  return around === 'origin';
}
export function isAroundPoint(around: Around): around is AroundPoint {
  return typeof around === 'object' && 'point' in around;
}

export const AroundSchema = z.union([
  z.literal('center'),
  z.literal('origin'),
  z.object({ point: z.tuple([z.number(), z.number(), z.number()]) }),
]);

/**
 * fixes dangling references after a geometric, material, or texture is deleted.
 * replaces broken references with default values (__white, __black, __lambertian_white, __unit_box).
 * also filters deleted items from the active scene's geometric list and list-type geometrics.
 */
export function fixReferences(config: NormalizedRenderConfig): NormalizedRenderConfig {
  const newConfig = { ...config };
  const textures = newConfig.textures ?? {};
  const materials = newConfig.materials ?? {};
  const geometrics = newConfig.geometrics ?? {};
  const scenes = newConfig.scenes ?? {};
  const textureNames = new Set(Object.keys(textures));
  const materialNames = new Set(Object.keys(materials));
  const geometricNames = new Set(Object.keys(geometrics));

  // fix texture references: checker sub-textures
  for (const texture of Object.values(textures)) {
    if (texture.type === 'checker') {
      if (!textureNames.has(texture.even_texture)) {
        texture.even_texture = '__white';
      }
      if (!textureNames.has(texture.odd_texture)) {
        texture.odd_texture = '__black';
      }
    }
  }

  // fix material references: texture refs in materials
  for (const material of Object.values(materials)) {
    switch (material.type) {
      case 'dielectric':
      case 'lambertian':
      case 'specular':
        if (!textureNames.has(material.reflectance_texture)) {
          material.reflectance_texture = '__white';
        }
        if (!textureNames.has(material.emittance_texture)) {
          material.emittance_texture = '__black';
        }
        break;
    }
  }

  // fix geometric references: material/texture refs in geometrics
  for (const geometric of Object.values(geometrics)) {
    switch (geometric.type) {
      case 'box':
      case 'disk':
      case 'obj_model':
      case 'parallelogram':
      case 'sphere':
      case 'triangle':
        if (!materialNames.has(geometric.material)) {
          geometric.material = '__lambertian_white';
        }
        break;
      case 'constant_volume':
        if (!textureNames.has(geometric.reflectance_texture)) {
          geometric.reflectance_texture = '__white';
        }
        break;
    }
  }

  // fix dangling geometric child references in composite geometrics
  for (const geometric of Object.values(geometrics)) {
    switch (geometric.type) {
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z':
      case 'translate':
      case 'constant_volume':
      case 'virtual':
        if (!geometricNames.has(geometric.geometric)) {
          geometric.geometric = '__unit_box';
        }
        break;
      case 'list':
        geometric.geometrics = geometric.geometrics.filter((name: string) =>
          geometricNames.has(name),
        );
        break;
    }
  }

  // remove deleted geometric names from the active scene's geometric list
  const activeScene = scenes[newConfig.active_scene];
  if (activeScene) {
    activeScene.geometrics = activeScene.geometrics.filter((name: string) =>
      geometricNames.has(name),
    );
  }

  return newConfig;
}

function moveKey<T>(
  collection: Record<string, T> | undefined,
  oldName: string,
  newName: string,
): Record<string, T> {
  if (!collection) {
    return {};
  }

  const result: Record<string, T> = {};
  for (const key of Object.keys(collection)) {
    if (key === oldName) {
      result[newName] = collection[oldName];
    } else {
      result[key] = collection[key];
    }
  }

  return result;
}

/**
 * renames a camera and updates all scene references
 * throughout the config to point to the new name.
 */
export function renameCamera(
  config: NormalizedRenderConfig,
  oldName: string,
  newName: string,
): NormalizedRenderConfig {
  const newConfig = { ...config };
  newConfig.cameras = moveKey(newConfig.cameras, oldName, newName);

  // update scene camera references
  Object.values(newConfig.scenes ?? {}).forEach((scene) => {
    if (scene.camera === oldName) {
      scene.camera = newName;
    }
  });

  return newConfig;
}

/**
 * renames a texture and updates all texture, material, and geometric references
 * throughout the config to point to the new name.
 */
export function renameTexture(
  config: NormalizedRenderConfig,
  oldName: string,
  newName: string,
): NormalizedRenderConfig {
  const newConfig = { ...config };
  newConfig.textures = moveKey(newConfig.textures, oldName, newName);

  // checker sub-textures
  Object.values(newConfig.textures ?? {}).forEach((texture) => {
    if (texture.type === 'checker') {
      if (texture.even_texture === oldName) {
        texture.even_texture = newName;
      }
      if (texture.odd_texture === oldName) {
        texture.odd_texture = newName;
      }
    }
  });

  // material reflectance/emittance textures
  Object.values(newConfig.materials ?? {}).forEach((material) => {
    switch (material.type) {
      case 'dielectric':
      case 'lambertian':
      case 'specular': {
        if (material.reflectance_texture === oldName) {
          material.reflectance_texture = newName;
        }
        if (material.emittance_texture === oldName) {
          material.emittance_texture = newName;
        }

        break;
      }
    }
  });

  // constant_volume geometric reflectance_texture
  Object.values(newConfig.geometrics ?? {}).forEach((geometric) => {
    switch (geometric.type) {
      case 'constant_volume': {
        if (geometric.reflectance_texture === oldName) {
          geometric.reflectance_texture = newName;
        }

        break;
      }
    }
  });

  return newConfig;
}

/**
 * renames a material and updates all geometric references
 * throughout the config to point to the new name.
 */
export function renameMaterial(
  config: NormalizedRenderConfig,
  oldName: string,
  newName: string,
): NormalizedRenderConfig {
  const newConfig = { ...config };
  newConfig.materials = moveKey(newConfig.materials, oldName, newName);

  // leaf geometrics: material reference
  Object.values(newConfig.geometrics ?? {}).forEach((geometric) => {
    switch (geometric.type) {
      case 'box':
      case 'disk':
      case 'obj_model':
      case 'parallelogram':
      case 'sphere':
      case 'triangle': {
        if (geometric.material === oldName) {
          geometric.material = newName;
        }

        break;
      }
    }
  });

  return newConfig;
}

/**
 * renames a geometric and updates all composite geometric, list geometric,
 * and scene references throughout the config to point to the new name.
 */
export function renameGeometric(
  config: NormalizedRenderConfig,
  oldName: string,
  newName: string,
): NormalizedRenderConfig {
  const newConfig = { ...config };
  newConfig.geometrics = moveKey(newConfig.geometrics, oldName, newName);

  // composite geometric references and list geometric arrays
  Object.values(newConfig.geometrics ?? {}).forEach((geometric) => {
    switch (geometric.type) {
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z':
      case 'translate':
      case 'constant_volume':
      case 'virtual': {
        if (geometric.geometric === oldName) {
          geometric.geometric = newName;
        }

        break;
      }
      case 'list': {
        geometric.geometrics = geometric.geometrics.map((name: string) =>
          name === oldName ? newName : name,
        );

        break;
      }
    }
  });

  // scene geometric lists
  if (newConfig.scenes) {
    const scenes = newConfig.scenes;
    const activeScene = scenes[newConfig.active_scene];
    if (activeScene) {
      activeScene.geometrics = activeScene.geometrics.map((name: string) =>
        name === oldName ? newName : name,
      );
    }
  }

  return newConfig;
}

/**
 * shallow-copy a material entry with a new unique name.
 */
export function duplicateMaterial(
  config: NormalizedRenderConfig,
  materialName: string,
): NormalizedRenderConfig {
  const materials = config.materials;
  if (!materials || !(materialName in materials)) {
    return config;
  }

  const newConfig = { ...config };
  const copy = { ...materials[materialName] };
  const newName = getNextUniqueName(materials, `${materialName} (copy)`);
  newConfig.materials = { ...newConfig.materials, [newName]: copy };

  return newConfig;
}

/**
 * shallow-copy a texture entry with a new unique name.
 */
export function duplicateTexture(
  config: NormalizedRenderConfig,
  textureName: string,
): NormalizedRenderConfig {
  const textures = config.textures;
  if (!textures || !(textureName in textures)) {
    return config;
  }

  const newConfig = { ...config };
  const copy = { ...textures[textureName] };
  const newName = getNextUniqueName(textures, `${textureName} (copy)`);
  newConfig.textures = { ...newConfig.textures, [newName]: copy };

  return newConfig;
}

/**
 * rebuild a record with keys in the specified order.
 * used to persist drag-and-drop reordering for IndexMap-backed collections.
 */
export function reorderRecordKeys<T>(
  record: Record<string, T>,
  orderedKeys: string[],
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key of orderedKeys) {
    if (key in record) {
      result[key] = record[key];
    }
  }
  return result;
}
