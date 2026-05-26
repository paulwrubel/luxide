import type { NormalizedRenderConfig, RenderConfig } from './config';
import { normalizeMaterialData, type RawMaterialData } from './material';
import { normalizeTextureData, type RawTextureData } from './texture';
import {
	capitalize,
	getNextUniqueName,
	isTypedObject,
	type Angle
} from './utils';
import { z } from 'zod';

// geometric types
export type GeometricData = NormalizedGeometricData;

export function normalizeGeometricData(
	config: RenderConfig,
	geometricData: RawGeometricData
): NormalizedGeometricData {
	switch (geometricData.type) {
		case 'box':
			return normalizeGeometricBox(config, geometricData);
		case 'list':
			return normalizeGeometricList(config, geometricData);
		case 'obj_model':
			return normalizeGeometricObjModel(config, geometricData);
		case 'rotate_x':
			return normalizeGeometricInstanceRotate(config, geometricData);
		case 'rotate_y':
			return normalizeGeometricInstanceRotate(config, geometricData);
		case 'rotate_z':
			return normalizeGeometricInstanceRotate(config, geometricData);
		case 'translate':
			return normalizeGeometricInstanceTranslate(config, geometricData);
		case 'parallelogram':
			return normalizeGeometricParallelogram(config, geometricData);
		case 'sphere':
			return normalizeGeometricSphere(config, geometricData);
		case 'triangle':
			return normalizeGeometricTriangle(config, geometricData);
		case 'constant_volume':
			return normalizeGeometricConstantVolume(config, geometricData);
	}
}

export type NormalizedGeometricData =
	| NormalizedGeometricBox
	| NormalizedGeometricList
	| NormalizedGeometricObjModel
	| NormalizedGeometricInstanceRotate
	| NormalizedGeometricInstanceTranslate
	| NormalizedGeometricParallelogram
	| NormalizedGeometricSphere
	| NormalizedGeometricTriangle
	| NormalizedGeometricConstantVolume;

export type RawGeometricData =
	| RawGeometricBox
	| RawGeometricList
	| RawGeometricObjModel
	| RawGeometricInstanceRotate
	| RawGeometricInstanceTranslate
	| RawGeometricParallelogram
	| RawGeometricSphere
	| RawGeometricTriangle
	| RawGeometricConstantVolume;

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

export function getReferencedMaterialNames(
	config: NormalizedRenderConfig,
	geometricName: string
): string[] {
	const { data } = getGeometricData(config, geometricName);
	const materials: string[] = [];
	switch (data.type) {
		case 'box':
		case 'obj_model':
		case 'parallelogram':
		case 'sphere':
		case 'triangle':
			materials.push(data.material);
			break;
		case 'list':
			materials.push(
				...data.geometrics.flatMap((geometricName) =>
					getReferencedMaterialNames(config, geometricName)
				)
			);
			break;
		case 'rotate_x':
		case 'rotate_y':
		case 'rotate_z':
		case 'translate':
		case 'constant_volume':
			materials.push(...getReferencedMaterialNames(config, data.geometric));
			break;
	}

	return [...new Set(materials)];
}

export function getCenterPoint(
	config: NormalizedRenderConfig,
	data: GeometricData
): [number, number, number] {
	switch (data.type) {
		case 'box':
			return [
				(data.a[0] + data.b[0]) / 2,
				(data.a[1] + data.b[1]) / 2,
				(data.a[2] + data.b[2]) / 2
			];
		case 'list': {
			const points = data.geometrics.map((geometricName) => {
				const { data: subData } = getGeometricDataSafe(config, geometricName);
				return getCenterPoint(config, subData);
			});

			return points.reduce(
				(acc, point) => [
					(acc[0] + point[0]) / 2,
					(acc[1] + point[1]) / 2,
					(acc[2] + point[2]) / 2
				],
				[0, 0, 0]
			);
		}
		case 'obj_model':
			return data.origin ?? [0, 0, 0];
		case 'rotate_x':
		case 'rotate_y':
		case 'rotate_z':
		case 'translate':
		case 'constant_volume': {
			const { data: subData } = getGeometricDataSafe(config, data.geometric);
			return getCenterPoint(config, subData);
		}
		case 'parallelogram':
			return [
				data.lower_left[0] + (data.u[0] + data.v[0]) / 2,
				data.lower_left[1] + (data.u[1] + data.v[1]) / 2,
				data.lower_left[2] + (data.u[2] + data.v[2]) / 2
			];
		case 'sphere':
			return data.center;
		case 'triangle':
			return [
				(data.a[0] + data.b[0] + data.c[0]) / 3,
				(data.a[1] + data.b[1] + data.c[1]) / 3,
				(data.a[2] + data.b[2] + data.c[2]) / 3
			];
	}
}

export type GeometricDataResult = {
	data: GeometricData;
	source: 'reference' | 'inline' | 'default';
	name?: string;
};

export function getGeometricDataSafe(
	config: RenderConfig,
	nameOrData: string | GeometricData
): GeometricDataResult {
	try {
		return getGeometricData(config, nameOrData);
	} catch (e) {
		console.warn(
			`Failed to get geometric data (${nameOrData}), using default geometric`,
			e
		);
		return {
			data: defaultGeometricForType('box'),
			source: 'default'
		};
	}
}

export function getGeometricData(
	config: RenderConfig,
	nameOrData: string | GeometricData
): GeometricDataResult {
	if (isGeometricData(nameOrData)) {
		return {
			data: nameOrData,
			source: 'inline'
		};
	}

	const geometric = config.geometrics?.[nameOrData];
	if (!geometric) {
		throw new Error(`Geometric ${nameOrData} not found`);
	}

	return {
		data: geometric,
		source: 'reference',
		name: nameOrData
	};
}

// function overloads for compile-time type checking
export function defaultGeometricForType(
	type: 'obj_model',
	options: { filename: string }
): GeometricObjModel;
export function defaultGeometricForType(
	type: Exclude<GeometricData['type'], 'obj_model'>
): GeometricData;

// implementation
export function defaultGeometricForType(
	type: GeometricData['type'],
	options?: { filename: string }
): GeometricData {
	switch (type) {
		case 'box':
			return {
				type: 'box',
				a: [-0.5, 0, 0.5],
				b: [0.5, 1.0, -0.5],
				material: '__lambertian_white'
			};
		case 'list':
			return {
				type: 'list',
				geometrics: ['__unit_box']
			};
		case 'obj_model':
			if (!options || options.filename.length === 0) {
				throw new Error('filename option required for obj_model');
			}
			return {
				type: 'obj_model',
				filename: options.filename,
				origin: [0, 0, 0],
				scale: 1,
				recalculate_normals: false,
				use_bvh: true,
				material: '__lambertian_white'
			};
		case 'rotate_x':
			return {
				type: 'rotate_x',
				geometric: '__unit_box',
				degrees: 0,
				around: [0, 0, 0]
			};
		case 'rotate_y':
			return {
				type: 'rotate_y',
				geometric: '__unit_box',
				degrees: 0,
				around: [0, 0, 0]
			};
		case 'rotate_z':
			return {
				type: 'rotate_z',
				geometric: '__unit_box',
				degrees: 0,
				around: [0, 0, 0]
			};
		case 'translate':
			return {
				type: 'translate',
				geometric: '__unit_box',
				translation: [0, 0, 0]
			};
		case 'parallelogram':
			return {
				type: 'parallelogram',
				lower_left: [0, 0, 0],
				u: [0, 0, 0],
				v: [0, 0, 0],
				material: '__lambertian_white'
			};
		case 'sphere':
			return {
				type: 'sphere',
				center: [0, 0, 0],
				radius: 1,
				material: '__lambertian_white'
			};
		case 'triangle':
			return {
				type: 'triangle',
				a: [0, 0, 0],
				b: [0, 0, 0],
				c: [0, 0, 0],
				material: '__lambertian_white'
			};
		case 'constant_volume':
			return {
				type: 'constant_volume',
				density: 1,
				geometric: '__unit_box',
				reflectance_texture: '__white'
			};
	}
}

export const GeometricBoxSchema = z.object({
	type: z.literal('box'),
	a: z.tuple([z.number(), z.number(), z.number()]),
	b: z.tuple([z.number(), z.number(), z.number()]),
	is_culled: z.boolean().optional(),
	material: z.string().nonempty()
});

export type GeometricBox = NormalizedGeometricBox;

export function normalizeGeometricBox(
	config: RenderConfig,
	geometricData: RawGeometricBox
): NormalizedGeometricBox {
	const geometric = geometricData;

	if (typeof geometric.material !== 'string') {
		if (!config.materials) {
			config.materials = {};
		}

		const materialName = getNextUniqueName(
			config.materials,
			capitalize(geometric.material.type)
		);
		config.materials[materialName] = normalizeMaterialData(
			config,
			geometric.material
		);
		geometric.material = materialName;
	}

	return geometric as NormalizedGeometricBox;
}

export type NormalizedGeometricBox = Omit<RawGeometricBox, 'material'> & {
	material: string;
};

export type RawGeometricBox = {
	type: 'box';
	a: [number, number, number];
	b: [number, number, number];
	is_culled?: boolean;
	material: string | RawMaterialData;
};

export const GeometricListSchema = z.object({
	type: z.literal('list'),
	use_bvh: z.boolean().optional(),
	geometrics: z.array(z.string().nonempty())
});

export type GeometricList = NormalizedGeometricList;

export function normalizeGeometricList(
	config: RenderConfig,
	geometricData: RawGeometricList
): NormalizedGeometricList {
	const geometric = geometricData;

	for (const [index, subGeometric] of geometric.geometrics.entries()) {
		if (typeof subGeometric !== 'string') {
			if (!config.geometrics) {
				config.geometrics = {};
			}

			const geometricName = getNextUniqueName(
				config.geometrics,
				capitalize(subGeometric.type)
			);
			config.geometrics[geometricName] = normalizeGeometricData(
				config,
				subGeometric
			);
			geometric.geometrics[index] = geometricName;
		}
	}

	return geometric as NormalizedGeometricList;
}

export type NormalizedGeometricList = Omit<RawGeometricList, 'geometrics'> & {
	geometrics: string[];
};

export type RawGeometricList = {
	type: 'list';
	use_bvh?: boolean;
	geometrics: (string | RawGeometricData)[];
};

export const GeometricObjModelSchema = z.object({
	type: z.literal('obj_model'),
	filename: z.string(),
	origin: z.tuple([z.number(), z.number(), z.number()]).optional(),
	scale: z.number().optional(),
	recalculate_normals: z.boolean().optional(),
	use_bvh: z.boolean().optional(),
	material: z.string().nonempty()
});

export type GeometricObjModel = NormalizedGeometricObjModel;

export function normalizeGeometricObjModel(
	config: RenderConfig,
	geometricData: RawGeometricObjModel
): NormalizedGeometricObjModel {
	const geometric = geometricData;

	if (typeof geometric.material !== 'string') {
		if (!config.materials) {
			config.materials = {};
		}

		const materialName = getNextUniqueName(
			config.materials,
			capitalize(geometric.material.type)
		);
		config.materials[materialName] = normalizeMaterialData(
			config,
			geometric.material
		);
		geometric.material = materialName;
	}

	return geometric as NormalizedGeometricObjModel;
}

export type NormalizedGeometricObjModel = Omit<
	RawGeometricObjModel,
	'material'
> & {
	material: string;
};

export type RawGeometricObjModel = {
	type: 'obj_model';
	filename: string;
	origin?: [number, number, number];
	scale?: number;
	recalculate_normals?: boolean;
	use_bvh?: boolean;
	material: string | RawMaterialData;
};

export const GeometricInstanceRotateXSchema = z.object({
	type: z.literal('rotate_x'),
	geometric: z.string().nonempty(),
	degrees: z.number().optional(),
	radians: z.number().optional()
});

export const GeometricInstanceRotateYSchema = z.object({
	type: z.literal('rotate_y'),
	geometric: z.string().nonempty(),
	degrees: z.number().optional(),
	radians: z.number().optional()
});

export const GeometricInstanceRotateZSchema = z.object({
	type: z.literal('rotate_z'),
	geometric: z.string().nonempty(),
	degrees: z.number().optional(),
	radians: z.number().optional()
});

export type GeometricInstanceRotate = NormalizedGeometricInstanceRotate;

export function normalizeGeometricInstanceRotate(
	config: RenderConfig,
	geometricData: RawGeometricInstanceRotate
): NormalizedGeometricInstanceRotate {
	const geometric = geometricData;

	if (typeof geometric.geometric !== 'string') {
		if (!config.geometrics) {
			config.geometrics = {};
		}

		const geometricName = getNextUniqueName(
			config.geometrics,
			capitalize(geometric.geometric.type)
		);
		config.geometrics[geometricName] = normalizeGeometricData(
			config,
			geometric.geometric
		);
		geometric.geometric = geometricName;
	}

	return geometric as NormalizedGeometricInstanceRotate;
}

export type NormalizedGeometricInstanceRotate = Omit<
	RawGeometricInstanceRotate,
	'geometric'
> & {
	geometric: string;
} & Angle;

export type RawGeometricInstanceRotate = {
	type: 'rotate_x' | 'rotate_y' | 'rotate_z';
	geometric: string | RawGeometricData;
	around?: [number, number, number];
} & Angle;

export const GeometricInstanceTranslateSchema = z.object({
	type: z.literal('translate'),
	geometric: z.string().nonempty(),
	translation: z.tuple([z.number(), z.number(), z.number()])
});

export type GeometricInstanceTranslate = NormalizedGeometricInstanceTranslate;

export function normalizeGeometricInstanceTranslate(
	config: RenderConfig,
	geometricData: RawGeometricInstanceTranslate
): NormalizedGeometricInstanceTranslate {
	const geometric = geometricData;

	if (typeof geometric.geometric !== 'string') {
		if (!config.geometrics) {
			config.geometrics = {};
		}

		const geometricName = getNextUniqueName(
			config.geometrics,
			capitalize(geometric.geometric.type)
		);
		config.geometrics[geometricName] = normalizeGeometricData(
			config,
			geometric.geometric
		);
		geometric.geometric = geometricName;
	}

	return geometric as NormalizedGeometricInstanceTranslate;
}

export type NormalizedGeometricInstanceTranslate = Omit<
	RawGeometricInstanceTranslate,
	'geometric'
> & {
	geometric: string;
};

export type RawGeometricInstanceTranslate = {
	type: 'translate';
	geometric: string | RawGeometricData;
	translation: [number, number, number];
};

export const GeometricParallelogramSchema = z.object({
	type: z.literal('parallelogram'),
	lower_left: z.tuple([z.number(), z.number(), z.number()]),
	u: z.tuple([z.number(), z.number(), z.number()]),
	v: z.tuple([z.number(), z.number(), z.number()]),
	is_culled: z.boolean().optional(),
	material: z.string().nonempty()
});

export type GeometricParallelogram = NormalizedGeometricParallelogram;

export function normalizeGeometricParallelogram(
	config: RenderConfig,
	geometricData: RawGeometricParallelogram
): NormalizedGeometricParallelogram {
	const geometric = geometricData;

	if (typeof geometric.material !== 'string') {
		if (!config.materials) {
			config.materials = {};
		}

		const materialName = getNextUniqueName(
			config.materials,
			capitalize(geometric.material.type)
		);
		config.materials[materialName] = normalizeMaterialData(
			config,
			geometric.material
		);
		geometric.material = materialName;
	}

	return geometric as NormalizedGeometricParallelogram;
}

export type NormalizedGeometricParallelogram = Omit<
	RawGeometricParallelogram,
	'material'
> & {
	material: string;
};

export type RawGeometricParallelogram = {
	type: 'parallelogram';
	lower_left: [number, number, number];
	u: [number, number, number];
	v: [number, number, number];
	is_culled?: boolean;
	material: string | RawMaterialData;
};

export const GeometricSphereSchema = z.object({
	type: z.literal('sphere'),
	center: z.tuple([z.number(), z.number(), z.number()]),
	radius: z.number().min(0),
	material: z.string().nonempty()
});

export type GeometricSphere = NormalizedGeometricSphere;

export function normalizeGeometricSphere(
	config: RenderConfig,
	geometricData: RawGeometricSphere
): NormalizedGeometricSphere {
	const geometric = geometricData;

	if (typeof geometric.material !== 'string') {
		if (!config.materials) {
			config.materials = {};
		}

		const materialName = getNextUniqueName(
			config.materials,
			capitalize(geometric.material.type)
		);
		config.materials[materialName] = normalizeMaterialData(
			config,
			geometric.material
		);
		geometric.material = materialName;
	}

	return geometric as NormalizedGeometricSphere;
}

export type NormalizedGeometricSphere = Omit<RawGeometricSphere, 'material'> & {
	material: string;
};

export type RawGeometricSphere = {
	type: 'sphere';
	center: [number, number, number];
	radius: number;
	material: string | RawMaterialData;
};

export const GeometricTriangleSchema = z.object({
	type: z.literal('triangle'),
	a: z.tuple([z.number(), z.number(), z.number()]),
	b: z.tuple([z.number(), z.number(), z.number()]),
	c: z.tuple([z.number(), z.number(), z.number()]),
	a_normal: z.tuple([z.number(), z.number(), z.number()]).optional(),
	b_normal: z.tuple([z.number(), z.number(), z.number()]).optional(),
	c_normal: z.tuple([z.number(), z.number(), z.number()]).optional(),
	is_culled: z.boolean().optional(),
	material: z.string().nonempty()
});

export type GeometricTriangle = NormalizedGeometricTriangle;

export function normalizeGeometricTriangle(
	config: RenderConfig,
	geometricData: RawGeometricTriangle
): NormalizedGeometricTriangle {
	const geometric = geometricData;

	if (typeof geometric.material !== 'string') {
		if (!config.materials) {
			config.materials = {};
		}

		const materialName = getNextUniqueName(
			config.materials,
			capitalize(geometric.material.type)
		);
		config.materials[materialName] = normalizeMaterialData(
			config,
			geometric.material
		);
		geometric.material = materialName;
	}

	return geometric as NormalizedGeometricTriangle;
}

export type NormalizedGeometricTriangle = Omit<
	RawGeometricTriangle,
	'material'
> & {
	material: string;
};

export type RawGeometricTriangle = {
	type: 'triangle';
	a: [number, number, number];
	b: [number, number, number];
	c: [number, number, number];
	a_normal?: [number, number, number];
	b_normal?: [number, number, number];
	c_normal?: [number, number, number];
	is_culled?: boolean;
	material: string | RawMaterialData;
};

export const GeometricConstantVolumeSchema = z.object({
	type: z.literal('constant_volume'),
	geometric: z.string().nonempty(),
	density: z.number().min(0),
	reflectance_texture: z.string().nonempty()
});

export type GeometricConstantVolume = NormalizedGeometricConstantVolume;

export function normalizeGeometricConstantVolume(
	config: RenderConfig,
	geometricData: RawGeometricConstantVolume
): NormalizedGeometricConstantVolume {
	const geometric = geometricData;

	if (typeof geometric.geometric !== 'string') {
		if (!config.geometrics) {
			config.geometrics = {};
		}

		const geometricName = getNextUniqueName(
			config.geometrics,
			capitalize(geometric.geometric.type)
		);
		config.geometrics[geometricName] = normalizeGeometricData(
			config,
			geometric.geometric
		);
		geometric.geometric = geometricName;
	}

	if (typeof geometric.reflectance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(geometric.reflectance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			geometric.reflectance_texture
		);
		geometric.reflectance_texture = textureName;
	}

	return geometric as NormalizedGeometricConstantVolume;
}

export type NormalizedGeometricConstantVolume = Omit<
	RawGeometricConstantVolume,
	'geometric' | 'reflectance_texture'
> & {
	geometric: string;
	reflectance_texture: string;
};

export type RawGeometricConstantVolume = {
	type: 'constant_volume';
	geometric: string | RawGeometricData;
	density: number;
	reflectance_texture: string | RawTextureData;
};

export const GeometricDataSchema = z.discriminatedUnion('type', [
	GeometricBoxSchema,
	GeometricListSchema,
	GeometricObjModelSchema,
	GeometricInstanceRotateXSchema,
	GeometricInstanceRotateYSchema,
	GeometricInstanceRotateZSchema,
	GeometricInstanceTranslateSchema,
	GeometricParallelogramSchema,
	GeometricSphereSchema,
	GeometricTriangleSchema,
	GeometricConstantVolumeSchema
]);
