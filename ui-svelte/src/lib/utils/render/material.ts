import type { NormalizedRenderConfig, RenderConfig } from './config';
import { normalizeTextureData, type RawTextureData } from './texture';
import { capitalize, getNextUniqueName, isTypedObject } from './utils';
import { z } from 'zod';

export type MaterialData = NormalizedMaterialData;

export function normalizeMaterialData(
	config: RenderConfig,
	materialData: RawMaterialData
): NormalizedMaterialData {
	switch (materialData.type) {
		case 'dielectric':
			return normalizeMaterialDielectric(config, materialData);
		case 'lambertian':
			return normalizeMaterialLambertian(config, materialData);
		case 'specular':
			return normalizeMaterialSpecular(config, materialData);
	}
}

export type NormalizedMaterialData =
	| NormalizedMaterialDielectric
	| NormalizedMaterialLambertian
	| NormalizedMaterialSpecular;

export type RawMaterialData =
	| RawMaterialDielectric
	| RawMaterialLambertian
	| RawMaterialSpecular;

export function isMaterialData(data: unknown): data is MaterialData {
	return (
		isTypedObject(data) &&
		['dielectric', 'lambertian', 'specular'].includes(data.type)
	);
}

export function getReferencedTextureNames(
	config: NormalizedRenderConfig,
	materialName: string
): string[] {
	const { data } = getMaterialData(config, materialName);
	const materials: string[] = [];
	switch (data.type) {
		case 'dielectric':
		case 'lambertian':
		case 'specular':
			materials.push(data.emittance_texture);
			materials.push(data.reflectance_texture);
			break;
	}

	return [...new Set(materials)];
}

export type MaterialDataResult = {
	data: MaterialData;
	source: 'reference' | 'inline' | 'default';
	name?: string;
};

export function getMaterialDataSafe(
	config: RenderConfig,
	nameOrData: string | MaterialData
): MaterialDataResult {
	try {
		return getMaterialData(config, nameOrData);
	} catch (e) {
		console.warn(
			`Failed to get material data (${nameOrData}), using default material`,
			e
		);
		return {
			data: defaultMaterialForType('lambertian'),
			source: 'default'
		};
	}
}

export function getMaterialData(
	config: RenderConfig,
	nameOrData: string | MaterialData
): MaterialDataResult {
	if (isMaterialData(nameOrData)) {
		return {
			data: nameOrData,
			source: 'inline'
		};
	}

	const material = config.materials?.[nameOrData];
	if (!material) {
		throw new Error(`Material ${nameOrData} not found`);
	}
	return {
		data: material,
		source: 'reference',
		name: nameOrData
	};
}

export function defaultMaterialForType(
	type: MaterialData['type']
): MaterialData {
	switch (type) {
		case 'dielectric':
			return {
				type: 'dielectric',
				reflectance_texture: '__white',
				emittance_texture: '__black',
				index_of_refraction: 1
			};
		case 'lambertian':
			return {
				type: 'lambertian',
				reflectance_texture: '__white',
				emittance_texture: '__black'
			};
		case 'specular':
			return {
				type: 'specular',
				reflectance_texture: '__white',
				emittance_texture: '__black',
				roughness: 1
			};
	}
}

export const MaterialDielectricSchema = z.object({
	type: z.literal('dielectric'),
	reflectance_texture: z.string().nonempty(),
	emittance_texture: z.string().nonempty(),
	index_of_refraction: z.number().min(0)
});

export type MaterialDielectric = NormalizedMaterialDielectric;

function normalizeMaterialDielectric(
	config: RenderConfig,
	materialData: RawMaterialDielectric
): NormalizedMaterialDielectric {
	const material = materialData;

	if (typeof material.reflectance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.reflectance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.reflectance_texture
		);
		material.reflectance_texture = textureName;
	}

	if (typeof material.emittance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.emittance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.emittance_texture
		);
		material.emittance_texture = textureName;
	}

	return material as NormalizedMaterialDielectric;
}

export type NormalizedMaterialDielectric = Omit<
	RawMaterialDielectric,
	'reflectance_texture' | 'emittance_texture'
> & {
	reflectance_texture: string;
	emittance_texture: string;
};

export type RawMaterialDielectric = {
	type: 'dielectric';
	reflectance_texture: string | RawTextureData;
	emittance_texture: string | RawTextureData;
	index_of_refraction: number;
};

export const MaterialLambertianSchema = z.object({
	type: z.literal('lambertian'),
	reflectance_texture: z.string().nonempty(),
	emittance_texture: z.string().nonempty()
});

export type MaterialLambertian = NormalizedMaterialLambertian;

export function normalizeMaterialLambertian(
	config: RenderConfig,
	materialData: RawMaterialLambertian
): NormalizedMaterialLambertian {
	const material = materialData;

	if (typeof material.reflectance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.reflectance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.reflectance_texture
		);
		material.reflectance_texture = textureName;
	}

	if (typeof material.emittance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.emittance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.emittance_texture
		);
		material.emittance_texture = textureName;
	}

	return material as NormalizedMaterialLambertian;
}

export type NormalizedMaterialLambertian = Omit<
	RawMaterialLambertian,
	'reflectance_texture' | 'emittance_texture'
> & {
	reflectance_texture: string;
	emittance_texture: string;
};

export type RawMaterialLambertian = {
	type: 'lambertian';
	reflectance_texture: string | RawTextureData;
	emittance_texture: string | RawTextureData;
};

export const MaterialSpecularSchema = z.object({
	type: z.literal('specular'),
	reflectance_texture: z.string().nonempty(),
	emittance_texture: z.string().nonempty(),
	roughness: z.number().min(0).max(1)
});

export type MaterialSpecular = NormalizedMaterialSpecular;

export function normalizeMaterialSpecular(
	config: RenderConfig,
	materialData: RawMaterialSpecular
): NormalizedMaterialSpecular {
	const material = materialData;

	if (typeof material.reflectance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.reflectance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.reflectance_texture
		);
		material.reflectance_texture = textureName;
	}

	if (typeof material.emittance_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(material.emittance_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			material.emittance_texture
		);
		material.emittance_texture = textureName;
	}

	return material as NormalizedMaterialSpecular;
}

export type NormalizedMaterialSpecular = Omit<
	RawMaterialSpecular,
	'reflectance_texture' | 'emittance_texture'
> & {
	reflectance_texture: string;
	emittance_texture: string;
};

export type RawMaterialSpecular = {
	type: 'specular';
	reflectance_texture: string | RawTextureData;
	emittance_texture: string | RawTextureData;
	roughness: number;
};
export const MaterialDataSchema = z.discriminatedUnion('type', [
	MaterialDielectricSchema,
	MaterialLambertianSchema,
	MaterialSpecularSchema
]);
