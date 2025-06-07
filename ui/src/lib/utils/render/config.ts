import z from 'zod';
import type { CameraData } from './camera';
import type { GeometricData } from './geometric';
import type { MaterialData } from './material';
import { RenderParametersSchema, type RenderParameters } from './parameters';
import { type SceneData, SceneDataSchema } from './scene';
import type { TextureData } from './texture';

export const RenderConfigSchema = z.object({
	name: z.string().nonempty(),
	parameters: RenderParametersSchema,
	active_scene: z.union([SceneDataSchema, z.string()])
	// active_scene: SceneDataSchema
});

// main render configuration type
export type RenderConfig = {
	name: string;
	parameters: RenderParameters;
	active_scene: string | SceneData;
	scenes?: Record<string, SceneData>;
	cameras?: Record<string, CameraData>;
	textures?: Record<string, TextureData>;
	materials?: Record<string, MaterialData>;
	geometrics?: Record<string, GeometricData>;
};
