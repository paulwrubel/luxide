import { degreesToRadians, radiansToDegrees } from '../math';
import { z } from 'zod';
import type { RenderConfig } from './config';

/* CONFIG HELPER FUNCTIONS */

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
