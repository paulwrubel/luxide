import { z } from 'zod';
import { type RawCameraData } from './camera';
import type { RenderConfig } from './config';
import { normalizeGeometricData, type RawGeometricData } from './geometric';
import { capitalize, getNextUniqueName, isNonNullObject } from './utils';

export const SceneDataSchema = z.object({
	// geometrics: z.array(z.union([z.string(), GeometricDataSchema])),
	// use_bvh: z.boolean().optional(),
	camera: z.string().nonempty()
	// camera: CameraDataSchema
	// background_color: z.tuple([
	// 	z.number().min(0).max(1),
	// 	z.number().min(0).max(1),
	// 	z.number().min(0).max(1)
	// ])
});

export type SceneData = NormalizedSceneData;

export function normalizeSceneData(
	config: RenderConfig,
	sceneData: RawSceneData
): NormalizedSceneData {
	const scene = sceneData;

	if (typeof scene.camera !== 'string') {
		if (!config.cameras) {
			config.cameras = {};
		}

		const cameraName = getNextUniqueName(config.cameras, 'Camera');
		config.cameras[cameraName] = scene.camera;
		scene.camera = cameraName;
	}

	for (const [index, geometric] of scene.geometrics.entries()) {
		if (typeof geometric !== 'string') {
			if (!config.geometrics) {
				config.geometrics = {};
			}

			const geometricName = getNextUniqueName(
				config.geometrics,
				capitalize(geometric.type)
			);
			config.geometrics[geometricName] = normalizeGeometricData(
				config,
				geometric
			);
			scene.geometrics[index] = geometricName;
		}
	}

	return scene as NormalizedSceneData;
}

// NormalizedSceneData is the same as a SceneData, but with all the
// fields which can be a reference or an inline definition replaced with a
// guaranteed reference
export type NormalizedSceneData = Omit<
	RawSceneData,
	'geometrics' | 'camera'
> & {
	geometrics: string[];
	camera: string;
};

export type RawSceneData = {
	geometrics: (string | RawGeometricData)[];
	use_bvh: boolean;
	camera: string | RawCameraData;
	background_color: [number, number, number];
};

export function isSceneData(x: unknown): x is SceneData {
	return (
		isNonNullObject(x) &&
		['geometrics', 'camera', 'background_color'].every((key) => key in x)
	);
}

export function getSceneData(
	config: RenderConfig,
	nameOrData: string | SceneData
): SceneData {
	if (isSceneData(nameOrData)) {
		return nameOrData;
	}

	const scene = config.scenes?.[nameOrData];
	if (!scene) {
		throw new Error(`Scene ${nameOrData} not found`);
	}
	return scene;
}
