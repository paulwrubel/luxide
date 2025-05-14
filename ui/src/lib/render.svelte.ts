import { setContext } from 'svelte';

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

// export type RenderState =
// 	| { type: 'created' }
// 	| { type: 'running'; checkpoint_iteration: number; progress_info: ProgressInfo }
// 	| { type: 'finished_checkpoint_iteration'; iteration: number }
// 	| { type: 'pausing'; checkpoint_iteration: number; progress_info: ProgressInfo }
// 	| { type: 'paused'; iteration: number };

// export type ProgressInfo = {
// 	tiles_completed: number;
// 	total_tiles: number;
// 	estimated_time_remaining_seconds?: number;
// };

export type SceneData = {
	geometrics: (string | GeometricData)[];
	use_bvh: boolean;
	camera: string | CameraData;
	background_color: [number, number, number];
};

// camera types
export type CameraData = {
	vertical_field_of_view_degrees: number;
	eye_location: [number, number, number];
	target_location: [number, number, number];
	view_up: [number, number, number];
	defocus_angle_degrees: number;
	focus_distance: 'eye_to_target' | number;
};

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
export type MaterialData = MaterialDielectric | MaterialLambertian | MaterialSpecular;

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
	type: 'solid_color';
	color: [number, number, number];
};

// utility types
export type Angle = { degrees: number } | { radians: number };

export function getDefaultRender(): RenderConfig {
	return getCornellBoxRender();
}

export function getCornellBoxRender(): RenderConfig {
	return {
		name: 'cornell_box',
		parameters: {
			image_dimensions: [500, 500],
			tile_dimensions: [1, 1],
			gamma_correction: 2.0,
			samples_per_checkpoint: 10,
			total_checkpoints: 100,
			saved_checkpoint_limit: 1,
			max_bounces: 50,
			use_scaling_truncation: true
		},
		active_scene: 'cornell_box',
		scenes: {
			cornell_box: {
				geometrics: ['room', 'far_left_box', 'near_right_box'],
				use_bvh: true,
				camera: {
					vertical_field_of_view_degrees: 40.0,
					eye_location: [0.5, 0.5, 1.44144],
					target_location: [0.5, 0.5, 0.0],
					view_up: [0.0, 1.0, 0.0],
					defocus_angle_degrees: 0.0,
					focus_distance: 'eye_to_target'
				},
				background_color: [0.0, 0.0, 0.0]
			}
		},
		geometrics: {
			left_wall: {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [0.0, 0.0, -1.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'lambertian_green'
			},
			right_wall: {
				type: 'parallelogram',
				lower_left: [1.0, 0.0, -1.0],
				u: [0.0, 0.0, 1.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'lambertian_red'
			},
			floor: {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 0.0, -1.0],
				is_culled: false,
				material: 'lambertian_white'
			},
			ceiling: {
				type: 'parallelogram',
				lower_left: [0.0, 1.0, -1.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 0.0, 1.0],
				is_culled: false,
				material: 'lambertian_white'
			},
			far_wall: {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, -1.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'lambertian_white'
			},
			near_wall: {
				type: 'parallelogram',
				lower_left: [1.0, 0.0, 0.0],
				u: [-1.0, 0.0, 0.0],
				v: [0.0, 1.0, 0.0],
				is_culled: true,
				material: 'lambertian_white'
			},
			ceiling_light: {
				type: 'parallelogram',
				lower_left: [0.35, 0.999, -0.65],
				u: [0.3, 0.0, 0.0],
				v: [0.0, 0.0, 0.3],
				is_culled: false,
				material: 'lambertian_white_light'
			},
			room: {
				type: 'list',
				geometrics: [
					'left_wall',
					'right_wall',
					'floor',
					'ceiling',
					'ceiling_light',
					'far_wall',
					'near_wall'
				],
				use_bvh: true
			},
			far_left_box: {
				type: 'rotate_y',
				geometric: {
					type: 'box',
					a: [0.2, 0.0, -0.5],
					b: [0.5, 0.6, -0.8],
					is_culled: false,
					material: 'lambertian_white'
				},
				degrees: 15.0,
				around: [0.35, 0.0, -0.65]
			},
			near_right_box: {
				type: 'rotate_y',
				geometric: {
					type: 'box',
					a: [0.5, 0.0, -0.2],
					b: [0.8, 0.3, -0.5],
					is_culled: false,
					material: 'lambertian_white'
				},
				degrees: -18.0,
				around: [0.65, 0.0, -0.35]
			}
		},
		materials: {
			lambertian_white: {
				type: 'lambertian',
				reflectance_texture: 'white',
				emittance_texture: 'black'
			},
			lambertian_white_light: {
				type: 'lambertian',
				reflectance_texture: 'black',
				emittance_texture: 'white_light'
			},
			lambertian_red: {
				type: 'lambertian',
				reflectance_texture: 'red',
				emittance_texture: 'black'
			},
			lambertian_green: {
				type: 'lambertian',
				reflectance_texture: 'green',
				emittance_texture: 'black'
			}
		},
		textures: {
			white: {
				type: 'solid_color',
				color: [0.73, 0.73, 0.73]
			},
			white_light: {
				type: 'solid_color',
				color: [7.0, 7.0, 7.0]
			},
			red: {
				type: 'solid_color',
				color: [0.65, 0.05, 0.05]
			},
			green: {
				type: 'solid_color',
				color: [0.12, 0.45, 0.15]
			}
		}
	};
}

// store state
const config = $state({} as RenderConfig);

// export function setConfig(newConfig: RenderConfig) {
// 	config = newConfig;
// }

setContext('render', config);
