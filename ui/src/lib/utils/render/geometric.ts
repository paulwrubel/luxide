import type { RenderConfig } from './config';
import type { MaterialData } from './material';
import { isTypedObject, type Angle } from './utils';

export type GeometricData =
	| GeometricBox
	| GeometricList
	| GeometricObjModel
	| GeometricInstanceRotate
	| GeometricInstanceTranslate
	| GeometricParallelogram
	| GeometricSphere
	| GeometricTriangle
	| GeometricConstantVolume;

export function isGeometricData(data: unknown): data is GeometricData {
	return (
		isTypedObject(data) &&
		[
			'box',
			'list',
			'obj_model',
			'rotate_x',
			'rotate_y',
			'rotate_z',
			'translate',
			'parallelogram',
			'sphere',
			'triangle',
			'constant_volume'
		].includes(data.type)
	);
}

export function isComposite(
	data: GeometricData
): data is
	| GeometricList
	| GeometricInstanceRotate
	| GeometricInstanceTranslate {
	return (
		data.type === 'list' ||
		data.type === 'rotate_x' ||
		data.type === 'rotate_y' ||
		data.type === 'rotate_z' ||
		data.type === 'translate'
	);
}

export function getGeometricData(
	config: RenderConfig,
	nameOrData: string | GeometricData
): GeometricData {
	if (isGeometricData(nameOrData)) {
		return nameOrData;
	}

	const geometric = config.geometrics?.[nameOrData];
	if (!geometric) {
		throw new Error(`Geometric ${nameOrData} not found`);
	}
	return geometric;
}

export type GeometricBox = {
	type: 'box';
	a: [number, number, number];
	b: [number, number, number];
	is_culled?: boolean;
	material: string | MaterialData;
};

export type GeometricList = {
	type: 'list';
	use_bvh?: boolean;
	geometrics: (string | GeometricData)[];
};

export type GeometricObjModel = {
	type: 'obj_model';
	filename: string;
	origin?: [number, number, number];
	scale?: number;
	recalculate_normals?: boolean;
	use_bvh?: boolean;
	material: string | MaterialData;
};

export type GeometricInstanceRotate = {
	type: 'rotate_x' | 'rotate_y' | 'rotate_z';
	geometric: string | GeometricData;
	around?: [number, number, number];
} & Angle;

export type GeometricInstanceTranslate = {
	type: 'translate';
	geometric: string | GeometricData;
	translation: [number, number, number];
};

export type GeometricParallelogram = {
	type: 'parallelogram';
	lower_left: [number, number, number];
	u: [number, number, number];
	v: [number, number, number];
	is_culled?: boolean;
	material: string | MaterialData;
};

export type GeometricSphere = {
	type: 'sphere';
	center: [number, number, number];
	radius: number;
	material: string | MaterialData;
};

export type GeometricTriangle = {
	type: 'triangle';
	a: [number, number, number];
	b: [number, number, number];
	c: [number, number, number];
	a_normal?: [number, number, number];
	b_normal?: [number, number, number];
	c_normal?: [number, number, number];
	is_culled?: boolean;
	material: string | MaterialData;
};

export type GeometricConstantVolume = {
	type: 'constant_volume';
	geometric: string | GeometricData;
	density: number;
	reflectance_texture: string;
};
