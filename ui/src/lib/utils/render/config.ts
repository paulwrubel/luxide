import z from 'zod';
import {
	CameraDataSchema,
	type NormalizedCameraData,
	type RawCameraData
} from './camera';
import type { NormalizedGeometricData, RawGeometricData } from './geometric';
import type { NormalizedMaterialData, RawMaterialData } from './material';
import { RenderParametersSchema, type RenderParameters } from './parameters';
import {
	type NormalizedSceneData,
	type RawSceneData,
	type SceneData
} from './scene';
import type { NormalizedTextureData, RawTextureData } from './texture';
import { getNextUniqueName } from './utils';

export const RenderConfigSchema = z.object({
	name: z.string().nonempty(),
	parameters: RenderParametersSchema,
	active_scene: z.string().nonempty(),
	cameras: z.record(z.string(), CameraDataSchema)
});

export type RenderConfig = NormalizedRenderConfig;

export function normalizeRenderConfig(
	config: RawRenderConfig
): NormalizedRenderConfig {
	const renderConfig = config;

	if (typeof renderConfig.active_scene !== 'string') {
		if (!renderConfig.scenes) {
			renderConfig.scenes = {};
		}

		const sceneName = getNextUniqueName(renderConfig.scenes, 'Scene');
		renderConfig.scenes[sceneName] = renderConfig.active_scene;
		renderConfig.active_scene = sceneName;
	}

	return renderConfig as NormalizedRenderConfig;
}

// NormalizedRenderConfig is the same as a RenderConfig, but with all the
// fields which can be a reference or an inline definition replaced with a
// guaranteed reference
export type NormalizedRenderConfig = Omit<
	RawRenderConfig,
	| 'active_scene'
	| 'scenes'
	| 'cameras'
	| 'textures'
	| 'materials'
	| 'geometrics'
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
