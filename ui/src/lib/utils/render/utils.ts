import { degreesToRadians, radiansToDegrees } from '../math';
import { z } from 'zod';

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

// Angle
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
