import type { RenderConfig } from './config';
import { isTypedObject } from './utils';

export type TextureData = TextureChecker | TextureImage | TextureSolidColor;

export function isTextureData(data: unknown): data is TextureData {
	return (
		isTypedObject(data) &&
		['checker', 'image', 'solid_color'].includes(data.type)
	);
}

export function getTextureData(
	config: RenderConfig,
	nameOrData: string | TextureData
): TextureData {
	if (isTextureData(nameOrData)) {
		return nameOrData;
	}

	const texture = config.textures?.[nameOrData];
	if (!texture) {
		throw new Error(`Texture ${nameOrData} not found`);
	}
	return texture;
}

export type TextureChecker = {
	type: 'checker';
	scale: number;
	even_texture: string | TextureData;
	odd_texture: string | TextureData;
};

export type TextureImage = {
	type: 'image';
	filename: string;
	gamma: number;
};

export type TextureSolidColor = {
	type: 'color';
	color: [number, number, number];
};
