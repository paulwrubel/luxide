import type { RenderConfig } from './config';
import type { TextureData } from './texture';
import { isTypedObject } from './utils';

export type MaterialData =
	| MaterialDielectric
	| MaterialLambertian
	| MaterialSpecular;

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

export type MaterialDielectric = {
	type: 'dielectric';
	reflectance_texture: string | TextureData;
	emittance_texture: string | TextureData;
	index_of_refraction: number;
};

export type MaterialLambertian = {
	type: 'lambertian';
	reflectance_texture: string | TextureData;
	emittance_texture: string | TextureData;
};

export type MaterialSpecular = {
	type: 'specular';
	reflectance_texture: string | TextureData;
	emittance_texture: string | TextureData;
	roughness: number;
};
