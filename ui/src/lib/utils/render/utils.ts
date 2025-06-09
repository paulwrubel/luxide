import { degreesToRadians, radiansToDegrees } from '../math';

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

export type Angle = { degrees: number } | { radians: number };

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
