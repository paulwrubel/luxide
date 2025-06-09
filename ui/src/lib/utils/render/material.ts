import type { RenderConfig } from './config';
import { normalizeTextureData, type RawTextureData } from './texture';
import { capitalize, getNextUniqueName, isTypedObject } from './utils';

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

export function getMaterialData(
	config: RenderConfig,
	nameOrData: string | MaterialData
): MaterialData {
	if (isMaterialData(nameOrData)) {
		return nameOrData;
	}

	const material = config.materials?.[nameOrData];
	if (!material) {
		throw new Error(`Material ${nameOrData} not found`);
	}
	return material;
}

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
