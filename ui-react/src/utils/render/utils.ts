import { degreesToRadians, radiansToDegrees } from '../math';
import { z } from 'zod';
import type { RenderConfig } from './config';

/* CONFIG HELPER FUNCTIONS */

export function removeDefaults(array: string[]) {
	return array.filter((item) => !item.startsWith('__'));
}

export function getTopLevelGeometricNames(config: RenderConfig) {
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
							return data.geometric;
						default:
							return [];
					}
				})
				.includes(name)
	);
}

export function getTopLevelMaterialNames(config: RenderConfig) {
	return Object.keys(config.materials ?? {});
}

export function getTopLevelTextureNames(config: RenderConfig) {
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
				.includes(name)
	);
}

/* GENERAL */

export function isNonNullObject(x: unknown): x is Record<string, unknown> {
	return typeof x === 'object' && x !== null;
}

export function isTypedObject(
	x: unknown
): x is Record<string, unknown> & { type: string } {
	return isNonNullObject(x) && 'type' in x && typeof x.type === 'string';
}

export function getNextUniqueName<T>(
	collection: Record<string, T>,
	baseName: string
): string {
	let cardinal = 1;
	let name = `${baseName} ${cardinal}`;
	while (name in collection) {
		cardinal++;
		name = `${baseName} ${cardinal}`;
	}
	return name;
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ANGLE */

export const AngleDegreesSchema = z.object({
	degrees: z.number()
});

export const AngleRadiansSchema = z.object({
	radians: z.number()
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

/**
 * fixes dangling references after a geometric, material, or texture is deleted.
 * replaces broken references with default values (__white, __black, __lambertian_white, __unit_box).
 * also filters deleted items from the active scene's geometric list and list-type geometrics.
 */
export function fixReferences(config: RenderConfig): RenderConfig {
	const newConfig = { ...config };

	// Fix texture references: checker sub-textures
	for (const texture of Object.values(newConfig.textures)) {
		if (texture.type === 'checker') {
			if (!Object.keys(newConfig.textures).includes(texture.even_texture)) {
				texture.even_texture = '__white';
			}
			if (!Object.keys(newConfig.textures).includes(texture.odd_texture)) {
				texture.odd_texture = '__black';
			}
		}
	}

	// Fix material references: texture refs in materials
	for (const material of Object.values(newConfig.materials)) {
		switch (material.type) {
			case 'dielectric':
			case 'lambertian':
			case 'specular':
				if (!Object.keys(newConfig.textures).includes(material.reflectance_texture)) {
					material.reflectance_texture = '__white';
				}
				if (!Object.keys(newConfig.textures).includes(material.emittance_texture)) {
					material.emittance_texture = '__black';
				}
				break;
		}
	}

	// Fix geometric references: material/texture refs in geometrics
	for (const geometric of Object.values(newConfig.geometrics)) {
		switch (geometric.type) {
			case 'box':
			case 'obj_model':
			case 'parallelogram':
			case 'sphere':
			case 'triangle':
				if (!Object.keys(newConfig.materials).includes(geometric.material)) {
					geometric.material = '__lambertian_white';
				}
				break;
			case 'constant_volume':
				if (!Object.keys(newConfig.textures).includes(geometric.reflectance_texture)) {
					geometric.reflectance_texture = '__white';
				}
				break;
		}
	}

	// Fix dangling geometric child references in composite geometrics
	for (const geometric of Object.values(newConfig.geometrics)) {
		switch (geometric.type) {
			case 'rotate_x':
			case 'rotate_y':
			case 'rotate_z':
			case 'translate':
			case 'constant_volume':
				if (!Object.keys(newConfig.geometrics).includes(geometric.geometric)) {
					geometric.geometric = '__unit_box';
				}
				break;
			case 'list':
				geometric.geometrics = geometric.geometrics.filter((name: string) =>
					Object.keys(newConfig.geometrics).includes(name)
				);
				break;
		}
	}

	// Remove deleted geometric names from the active scene's geometric list
	const activeScene = newConfig.scenes[newConfig.active_scene];
	if (activeScene) {
		activeScene.geometrics = activeScene.geometrics.filter((name: string) =>
			Object.keys(newConfig.geometrics).includes(name)
		);
	}

	return newConfig;
}
