import type { FormPath } from 'sveltekit-superforms';
import type {
	NormalizedRenderConfig,
	RenderConfig,
	RenderConfigSchema
} from './config';
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

export type GeometricDataResult = {
	data: GeometricData;
	source: 'reference' | 'inline';
	name?: string;
	path: FormPath<z.infer<typeof RenderConfigSchema>>;
};

export function getGeometricData(
	config: RenderConfig,
	nameOrData: string | GeometricData,
	parentPath?: FormPath<z.infer<typeof RenderConfigSchema>>
): GeometricDataResult {
	if (isGeometricData(nameOrData)) {
		const path = parentPath
			? (`${parentPath}.geometric` as FormPath<
					z.infer<typeof RenderConfigSchema>
				>)
			: (`geometric` as FormPath<z.infer<typeof RenderConfigSchema>>);

		return {
			data: nameOrData,
			source: 'inline',
			path: path
		};
	}

	const geometric = config.geometrics?.[nameOrData];
	if (!geometric) {
		throw new Error(`Geometric ${nameOrData} not found`);
	}

	return {
		data: geometric,
		source: 'reference',
		name: nameOrData,
		path: `geometrics.${nameOrData}` as FormPath<
			z.infer<typeof RenderConfigSchema>
		>
	};
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
