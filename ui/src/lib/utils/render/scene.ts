import { z } from 'zod';
import { type CameraData, CameraDataSchema } from './camera';
import type { RenderConfig } from './config';
import type { GeometricData } from './geometric';
import { isNonNullObject } from './utils';

export type SceneData = {
	geometrics: (string | GeometricData)[];
	use_bvh: boolean;
	camera: string | CameraData;
	background_color: [number, number, number];
};

export const SceneDataSchema = z.object({
	// geometrics: z.array(z.union([z.string(), GeometricDataSchema])),
	// use_bvh: z.boolean().optional(),
	camera: z.union([z.string(), CameraDataSchema])
	// background_color: z.tuple([
	// 	z.number().min(0).max(1),
	// 	z.number().min(0).max(1),
	// 	z.number().min(0).max(1)
	// ])
});

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
