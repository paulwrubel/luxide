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

function removeDefaultResources(config: NormalizedRenderConfig): void {
  const isNotDefault = (name: string) => !name.startsWith('__');
  config.scenes = filterRecord(config.scenes, isNotDefault);
  config.cameras = filterRecord(config.cameras, isNotDefault);
  config.geometrics = filterRecord(config.geometrics, isNotDefault);
  config.materials = filterRecord(config.materials, isNotDefault);
  config.textures = filterRecord(config.textures, isNotDefault);
}

function filterRecord<T>(
  record: Record<string, T> | undefined,
  keep: (key: string) => boolean,
): Record<string, T> | undefined {
  if (!record) {
    return record;
  }

  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (keep(key)) {
      result[key] = value;
    }
  }
  return result;
}

export function normalizeRenderConfig(config: RenderConfig): NormalizedRenderConfig {
  const renderConfig = config;

  // pass 1: extract inline active_scene into the scenes map
  if (typeof renderConfig.active_scene !== 'string') {
    if (!renderConfig.scenes) {
      renderConfig.scenes = {};
    }

    const sceneName = getNextUniqueName(renderConfig.scenes, 'Scene');
    renderConfig.scenes[sceneName] = renderConfig.active_scene;
    renderConfig.active_scene = sceneName;
  }

  // pass 2: normalize all maps — convert inline data to named references
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

  // pass 3: remove default fallback resources
  removeDefaultResources(renderConfig as NormalizedRenderConfig);

  return renderConfig as NormalizedRenderConfig;
}

// this is the same as a RenderConfig, but with all the
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
