import { z } from 'zod';
import type { RenderConfig, RenderConfigSchema } from './config';
import { isNonNullObject } from './utils';
import type { FormPath } from 'sveltekit-superforms';

export type CameraData = {
	vertical_field_of_view_degrees: number;
	eye_location: [number, number, number];
	target_location: [number, number, number];
	view_up: [number, number, number];
	defocus_angle_degrees: number;
	focus_distance: 'eye_to_target' | number;
};

export const CAMERA_SCHEMA_DEFAULTS: CameraData = {
	vertical_field_of_view_degrees: 40.0,
	eye_location: [0.0, 0.0, 10.0],
	target_location: [0.0, 0.0, 0.0],
	view_up: [0.0, 0.0, 0.0],
	defocus_angle_degrees: 0.0,
	focus_distance: 'eye_to_target'
};

export const CameraDataSchema = z
	.object({
		vertical_field_of_view_degrees: z
			.number()
			.min(0)
			.max(180)
			.default(CAMERA_SCHEMA_DEFAULTS.vertical_field_of_view_degrees),
		eye_location: z
			.tuple([z.number(), z.number(), z.number()])
			.default(CAMERA_SCHEMA_DEFAULTS.eye_location),
		target_location: z
			.tuple([z.number(), z.number(), z.number()])
			.default(CAMERA_SCHEMA_DEFAULTS.target_location),
		view_up: z
			.tuple([z.number(), z.number(), z.number()])
			.default(CAMERA_SCHEMA_DEFAULTS.view_up),
		defocus_angle_degrees: z
			.number()
			.min(0)
			.max(180)
			.default(CAMERA_SCHEMA_DEFAULTS.defocus_angle_degrees),
		focus_distance: z
			.union([z.literal('eye_to_target'), z.number().min(0)])
			.default(CAMERA_SCHEMA_DEFAULTS.focus_distance)
	})
	.default(CAMERA_SCHEMA_DEFAULTS);

export function isCameraData(data: unknown): data is CameraData {
	return (
		isNonNullObject(data) &&
		[
			'vertical_field_of_view_degrees',
			'eye_location',
			'target_location',
			'view_up',
			'defocus_angle_degrees',
			'focus_distance'
		].every((key) => key in data)
	);
}

export type CameraDataResult = {
	data: CameraData;
	source: 'reference' | 'inline';
	path: FormPath<z.infer<typeof RenderConfigSchema>>;
};

export function getCameraData(
	config: RenderConfig,
	nameOrData: string | CameraData
): CameraDataResult {
	if (isCameraData(nameOrData)) {
		return {
			data: nameOrData,
			source: 'inline',
			path: 'active_scene.camera' as FormPath<
				z.infer<typeof RenderConfigSchema>
			>
		};
	}

	const camera = config.cameras?.[nameOrData];
	if (!camera) {
		throw new Error(`Camera ${nameOrData} not found`);
	}

	return {
		data: camera,
		source: 'reference',
		path: `cameras.${nameOrData}` as FormPath<
			z.infer<typeof RenderConfigSchema>
		>
	};
}
