import z from 'zod';
import { CameraDataSchema, type NormalizedCameraData, type RawCameraData } from './camera';
import {
  GeometricDataSchema,
  normalizeGeometricData,
  type NormalizedGeometricData,
  type RawGeometricData,
} from './geometric';
import {
  MaterialDataSchema,
  normalizeMaterialData,
  type NormalizedMaterialData,
  type RawMaterialData,
} from './material';
import { RenderParametersSchema, type RenderParameters } from './parameters';
import {
  normalizeSceneData,
  SceneDataSchema,
  type NormalizedSceneData,
  type RawSceneData,
  type SceneData,
} from './scene';
import {
  normalizeTextureData,
  TextureDataSchema,
  type NormalizedTextureData,
  type RawTextureData,
} from './texture';
import { getNextUniqueName } from './utils';

export const RenderConfigSchema = z.object({
  name: z.string().nonempty(),
  parameters: RenderParametersSchema,
  active_scene: z.string().nonempty(),
  scenes: z.record(z.string(), SceneDataSchema),
  cameras: z.record(z.string(), CameraDataSchema),
  geometrics: z.record(z.string(), GeometricDataSchema),
  materials: z.record(z.string(), MaterialDataSchema),
  textures: z.record(z.string(), TextureDataSchema),
});

export type RenderConfig = RawRenderConfig | NormalizedRenderConfig;

function pruneNormalizedConfig(config: NormalizedRenderConfig): void {
  const activeScene = config.scenes?.[config.active_scene];
  if (!activeScene) return;

  const reachableCameras = new Set<string>([activeScene.camera]);
  const reachableGeometrics = new Set<string>();
  const reachableMaterials = new Set<string>();
  const reachableTextures = new Set<string>();

  // walk geometrics reachable from the active scene
  const geoStack = [...activeScene.geometrics];
  while (geoStack.length > 0) {
    const geoName = geoStack.pop()!;
    if (reachableGeometrics.has(geoName)) continue;
    const geo = config.geometrics?.[geoName];
    if (!geo) continue;
    reachableGeometrics.add(geoName);

    switch (geo.type) {
      case 'box':
      case 'parallelogram':
      case 'sphere':
      case 'triangle':
      case 'obj_model':
        reachableMaterials.add(geo.material);
        break;
      case 'translate':
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z':
        geoStack.push(geo.geometric);
        break;
      case 'constant_volume':
        geoStack.push(geo.geometric);
        reachableTextures.add(geo.reflectance_texture);
        break;
      case 'list':
        for (const childName of geo.geometrics) {
          geoStack.push(childName);
        }
        break;
    }
  }

  // walk materials to collect textures, then walk textures for checker sub-textures
  const matStack = [...reachableMaterials];
  while (matStack.length > 0) {
    const matName = matStack.pop()!;
    const mat = config.materials?.[matName];
    if (!mat) continue;
    for (const texName of [mat.reflectance_texture, mat.emittance_texture]) {
      if (!reachableTextures.has(texName)) {
        reachableTextures.add(texName);
        collectTextureRefs(config, texName, reachableTextures);
      }
    }
  }

  // prune maps to reachable entries only
  config.scenes = pick(config.scenes, new Set([config.active_scene]));
  config.cameras = pick(config.cameras, reachableCameras);
  config.geometrics = pick(config.geometrics, reachableGeometrics);
  config.materials = pick(config.materials, reachableMaterials);
  config.textures = pick(config.textures, reachableTextures);
}

export function normalizeRenderConfig(config: RenderConfig): NormalizedRenderConfig {
  const renderConfig = config;

  // PASS 1: extract inline active_scene into the scenes map
  if (typeof renderConfig.active_scene !== 'string') {
    if (!renderConfig.scenes) {
      renderConfig.scenes = {};
    }

    const sceneName = getNextUniqueName(renderConfig.scenes, 'Scene');
    renderConfig.scenes[sceneName] = renderConfig.active_scene;
    renderConfig.active_scene = sceneName;
  }

  // PASS 2: normalize all maps — convert inline data to named references
  for (const scene of Object.values(renderConfig.scenes ?? {})) {
    normalizeSceneData(renderConfig, scene);
  }
  for (const geo of Object.values(renderConfig.geometrics ?? {})) {
    normalizeGeometricData(renderConfig, geo);
  }
  for (const mat of Object.values(renderConfig.materials ?? {})) {
    normalizeMaterialData(renderConfig, mat);
  }
  for (const tex of Object.values(renderConfig.textures ?? {})) {
    normalizeTextureData(renderConfig, tex);
  }

  // PASS 3: prune unreferenced entries
  // After normalization, the config is effectively normalized — cast at this boundary
  pruneNormalizedConfig(renderConfig as NormalizedRenderConfig);

  return renderConfig as NormalizedRenderConfig;
}

function pick<T>(
  record: Record<string, T> | undefined,
  keys: Set<string>,
): Record<string, T> | undefined {
  if (!record) return record;
  const result: Record<string, T> = {};
  for (const key of keys) {
    if (key in record) {
      result[key] = record[key];
    }
  }
  return result;
}

function collectTextureRefs(
  config: NormalizedRenderConfig,
  texName: string,
  reachableTextures: Set<string>,
): void {
  const tex = config.textures?.[texName];
  if (!tex || tex.type !== 'checker') return;
  for (const subName of [tex.even_texture, tex.odd_texture]) {
    if (!reachableTextures.has(subName)) {
      reachableTextures.add(subName);
      collectTextureRefs(config, subName, reachableTextures);
    }
  }
}

// NormalizedRenderConfig is the same as a RenderConfig, but with all the
// fields which can be a reference or an inline definition replaced with a
// guaranteed reference
export type NormalizedRenderConfig = Omit<
  RawRenderConfig,
  'active_scene' | 'scenes' | 'cameras' | 'textures' | 'materials' | 'geometrics'
> & {
  active_scene: string;
  scenes?: Record<string, NormalizedSceneData>;
  cameras?: Record<string, NormalizedCameraData>;
  textures?: Record<string, NormalizedTextureData>;
  materials?: Record<string, NormalizedMaterialData>;
  geometrics?: Record<string, NormalizedGeometricData>;
};

export type RawRenderConfig = {
  name: string;
  parameters: RenderParameters;
  active_scene: string | SceneData;
  scenes?: Record<string, RawSceneData>;
  cameras?: Record<string, RawCameraData>;
  textures?: Record<string, RawTextureData>;
  materials?: Record<string, RawMaterialData>;
  geometrics?: Record<string, RawGeometricData>;
};
