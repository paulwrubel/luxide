import { z } from 'zod';
import type { RenderConfig } from './config';
import { capitalize, getNextUniqueName, isTypedObject } from './utils';

export type TextureData = NormalizedTextureData;

export function normalizeTextureData(
	config: RenderConfig,
	textureData: RawTextureData
): NormalizedTextureData {
	switch (textureData.type) {
		case 'checker':
			return normalizeTextureChecker(config, textureData);
		case 'image':
			return textureData;
		case 'color':
			return textureData;
	}
}

export type NormalizedTextureData =
	| NormalizedTextureChecker
	| NormalizedTextureImage
	| NormalizedTextureSolidColor;

export type RawTextureData =
	| RawTextureChecker
	| RawTextureImage
	| RawTextureSolidColor;

export function isTextureData(data: unknown): data is TextureData {
	return (
		isTypedObject(data) && ['checker', 'image', 'color'].includes(data.type)
	);
}

export type TextureDataResult = {
	data: TextureData;
	source: 'reference' | 'inline' | 'default';
	name?: string;
};

export function getTextureDataSafe(
	config: RenderConfig,
	nameOrData: string | TextureData
): TextureDataResult {
	try {
		return getTextureData(config, nameOrData);
	} catch (e) {
		console.warn(
			`Failed to get texture data (${nameOrData}), using default texture`,
			e
		);
		return {
			data: defaultTextureForType('color'),
			source: 'default'
		};
	}
}

export function getTextureData(
	config: RenderConfig,
	nameOrData: string | TextureData
): TextureDataResult {
	if (isTextureData(nameOrData)) {
		return {
			data: nameOrData,
			source: 'inline'
		};
	}

	const texture = config.textures?.[nameOrData];
	if (!texture) {
		throw new Error(`Texture ${nameOrData} not found`);
	}
	return {
		data: texture,
		source: 'reference',
		name: nameOrData
	};
}

// function overloads for compile-time type checking
export function defaultTextureForType(
	type: 'image',
	options: { filename: string }
): TextureImage;
export function defaultTextureForType(
	type: Exclude<TextureData['type'], 'image'>
): TextureData;

// implementation
export function defaultTextureForType(
	type: TextureData['type'],
	options?: { filename: string }
): TextureData {
	switch (type) {
		case 'checker':
			return {
				type: 'checker',
				scale: 1,
				even_texture: '__white',
				odd_texture: '__black'
			};
		case 'image':
			if (!options || options.filename.length === 0) {
				throw new Error('filename option required for image texture');
			}
			return {
				type: 'image',
				filename: options.filename,
				gamma: 1
			};
		case 'color':
			return {
				type: 'color',
				color: [1, 1, 1]
			};
	}
}

export const TextureCheckerSchema = z.object({
	type: z.literal('checker'),
	scale: z.number().min(0),
	even_texture: z.string().nonempty(),
	odd_texture: z.string().nonempty()
});

export type TextureChecker = NormalizedTextureChecker;

export function normalizeTextureChecker(
	config: RenderConfig,
	textureData: RawTextureChecker
): NormalizedTextureChecker {
	const texture = textureData;

	if (typeof texture.even_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(texture.even_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			texture.even_texture
		);
		texture.even_texture = textureName;
	}

	if (typeof texture.odd_texture !== 'string') {
		if (!config.textures) {
			config.textures = {};
		}

		const textureName = getNextUniqueName(
			config.textures,
			capitalize(texture.odd_texture.type)
		);
		config.textures[textureName] = normalizeTextureData(
			config,
			texture.odd_texture
		);
		texture.odd_texture = textureName;
	}

	return texture as NormalizedTextureChecker;
}

export type NormalizedTextureChecker = Omit<
	RawTextureChecker,
	'even_texture' | 'odd_texture'
> & {
	even_texture: string;
	odd_texture: string;
};

export type RawTextureChecker = {
	type: 'checker';
	scale: number;
	even_texture: string | RawTextureData;
	odd_texture: string | RawTextureData;
};

export const TextureImageSchema = z.object({
	type: z.literal('image'),
	filename: z.string().nonempty(),
	gamma: z.number().min(0)
});

export type TextureImage = NormalizedTextureImage;
export type NormalizedTextureImage = RawTextureImage;
export type RawTextureImage = {
	type: 'image';
	filename: string;
	gamma: number;
};

export const TextureSolidColorSchema = z.object({
	type: z.literal('color'),
	color: z.tuple([z.number().min(0), z.number().min(0), z.number().min(0)])
});

export type TextureSolidColor = NormalizedTextureSolidColor;
export type NormalizedTextureSolidColor = RawTextureSolidColor;
export type RawTextureSolidColor = {
	type: 'color';
	color: [number, number, number];
};

export const TextureDataSchema = z.discriminatedUnion('type', [
	TextureCheckerSchema,
	TextureImageSchema,
	TextureSolidColorSchema
]);
