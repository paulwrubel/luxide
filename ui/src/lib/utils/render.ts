import { degreesToRadians, radiansToDegrees } from './math';

export function isNonNullObject(x: unknown): x is Record<string, unknown> {
	return typeof x === 'object' && x !== null;
}

export function isTypedObject(
	x: unknown
): x is Record<string, unknown> & { type: string } {
	return isNonNullObject(x) && 'type' in x && typeof x.type === 'string';
}

// main render configuration type
export type RenderConfig = {
	name: string;
	parameters: RenderParameters;
	active_scene: string | SceneData;
	scenes?: Record<string, SceneData>;
	cameras?: Record<string, CameraData>;
	textures?: Record<string, TextureData>;
	materials?: Record<string, MaterialData>;
	geometrics?: Record<string, GeometricData>;
};

// render parameters
export type RenderParameters = {
	image_dimensions: [number, number];
	tile_dimensions: [number, number];
	gamma_correction: number;
	samples_per_checkpoint: number;
	total_checkpoints: number;
	saved_checkpoint_limit?: number;
	max_bounces: number;
	use_scaling_truncation: boolean;
};

export type SceneData = {
	geometrics: (string | GeometricData)[];
	use_bvh: boolean;
	camera: string | CameraData;
	background_color: [number, number, number];
};

export function isSceneData(x: unknown): x is SceneData {
	return (
		isNonNullObject(x) &&
		['geometrics', 'camera', 'background_color'].every((key) => key in x)
	);
}

export function getSceneData(
	config: RenderConfig,
	nameOrData: string | SceneData
): SceneData {
	if (isSceneData(nameOrData)) {
		return nameOrData;
	}

	const scene = config.scenes?.[nameOrData];
	if (!scene) {
		throw new Error(`Scene ${nameOrData} not found`);
	}
	return scene;
}

// camera types
export type CameraData = {
	vertical_field_of_view_degrees: number;
	eye_location: [number, number, number];
	target_location: [number, number, number];
	view_up: [number, number, number];
	defocus_angle_degrees: number;
	focus_distance: 'eye_to_target' | number;
};

export function isCameraData(data: unknown): data is CameraData {
	return (
		isNonNullObject(data) &&
		[
			'vertical_field_of_view_degrees',
			'eye_location',
			'target_location',
			'view_up',
			'defocus_angle_degrees',
			'focus_distance'
		].every((key) => key in data)
	);
}

export function getCameraData(
	config: RenderConfig,
	nameOrData: string | CameraData
): CameraData {
	if (isCameraData(nameOrData)) {
		return nameOrData;
	}

	const camera = config.cameras?.[nameOrData];
	if (!camera) {
		throw new Error(`Camera ${nameOrData} not found`);
	}
	return camera;
}

// geometric types
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

// material types
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

// texture types
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

// utility types
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
