import type { RenderConfig } from './config';
import type { GeometricData } from './geometric';
import type { MaterialData } from './material';
import type { TextureData } from './texture';

export function getDefaultRenderConfig(): RenderConfig {
	return getCornellBoxRenderConfig();
}

export function getEmptyRenderConfig(): RenderConfig {
	return withDefaultResources({
		name: 'Empty',
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
		active_scene: 'Scene 1',
		scenes: {
			'Scene 1': {
				geometrics: [],
				use_bvh: true,
				camera: 'Camera 1',
				background_color: [0.0, 0.0, 0.0]
			}
		},
		cameras: {
			'Camera 1': {
				vertical_field_of_view_degrees: 40.0,
				eye_location: [0.0, 0.0, -10.0],
				target_location: [0.0, 0.0, 0.0],
				view_up: [0.0, 1.0, 0.0],
				defocus_angle_degrees: 0.0,
				focus_distance: 'eye_to_target'
			}
		},
		geometrics: {},
		materials: {},
		textures: {}
	});
}

export function getCornellBoxRenderConfig(): RenderConfig {
	return withDefaultResources({
		name: 'Cornell Box',
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
		active_scene: 'Cornell Box',
		scenes: {
			'Cornell Box': {
				geometrics: [
					'Far Left Box',
					'Near Right Box',
					'Left Wall',
					'Right Wall',
					'Floor',
					'Ceiling',
					'Ceiling Light',
					'Far Wall',
					'Near Wall'
				],
				use_bvh: true,
				camera: 'Camera 1',
				background_color: [0.0, 0.0, 0.0]
			}
		},
		cameras: {
			'Camera 1': {
				vertical_field_of_view_degrees: 40.0,
				eye_location: [5.0, 5.0, 14.4144],
				target_location: [5.0, 5.0, 0.0],
				view_up: [0.0, 1.0, 0.0],
				defocus_angle_degrees: 0.0,
				focus_distance: 'eye_to_target'
			}
		},
		geometrics: {
			'Left Wall': {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [0.0, 0.0, -10.0],
				v: [0.0, 10.0, 0.0],
				is_culled: false,
				material: 'Green'
			},
			'Right Wall': {
				type: 'parallelogram',
				lower_left: [10.0, 0.0, -10.0],
				u: [0.0, 0.0, 10.0],
				v: [0.0, 10.0, 0.0],
				is_culled: false,
				material: 'Red'
			},
			Floor: {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [10.0, 0.0, 0.0],
				v: [0.0, 0.0, -10.0],
				is_culled: false,
				material: 'White'
			},
			Ceiling: {
				type: 'parallelogram',
				lower_left: [0.0, 10.0, -10.0],
				u: [10.0, 0.0, 0.0],
				v: [0.0, 0.0, 10.0],
				is_culled: false,
				material: 'White'
			},
			'Far Wall': {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, -10.0],
				u: [10.0, 0.0, 0.0],
				v: [0.0, 10.0, 0.0],
				is_culled: false,
				material: 'White'
			},
			'Near Wall': {
				type: 'parallelogram',
				lower_left: [10.0, 0.0, 0.0],
				u: [-10.0, 0.0, 0.0],
				v: [0.0, 10.0, 0.0],
				is_culled: true,
				material: 'White'
			},
			'Ceiling Light': {
				type: 'parallelogram',
				lower_left: [3.5, 9.99, -6.5],
				u: [3.0, 0.0, 0.0],
				v: [0.0, 0.0, 3.0],
				is_culled: false,
				material: 'White Light'
			},
			'Far Left Box': {
				type: 'rotate_y',
				geometric: 'Far Left Box - Unrotated',
				degrees: 15.0,
				around: [3.5, 0.0, -6.5]
			},
			'Far Left Box - Unrotated': {
				type: 'box',
				a: [2.0, 0.0, -5.0],
				b: [5.0, 6.0, -8.0],
				is_culled: false,
				material: 'White'
			},
			'Near Right Box': {
				type: 'rotate_y',
				geometric: 'Near Right Box - Unrotated',
				degrees: 342.0,
				around: [6.5, 0.0, -3.5]
			},
			'Near Right Box - Unrotated': {
				type: 'box',
				a: [5.0, 0.0, -2.0],
				b: [8.0, 3.0, -5.0],
				is_culled: false,
				material: 'White'
			}
		},
		materials: {
			White: {
				type: 'lambertian',
				reflectance_texture: 'White',
				emittance_texture: 'Black'
			},
			'White Light': {
				type: 'lambertian',
				reflectance_texture: 'Black',
				emittance_texture: 'White Light'
			},
			Red: {
				type: 'lambertian',
				reflectance_texture: 'Red',
				emittance_texture: 'Black'
			},
			Green: {
				type: 'lambertian',
				reflectance_texture: 'Green',
				emittance_texture: 'Black'
			}
		},
		textures: {
			Black: {
				type: 'color',
				color: [0.0, 0.0, 0.0]
			},
			White: {
				type: 'color',
				color: [0.73, 0.73, 0.73]
			},
			'White Light': {
				type: 'color',
				color: [7.0, 7.0, 7.0]
			},
			Red: {
				type: 'color',
				color: [0.65, 0.05, 0.05]
			},
			Green: {
				type: 'color',
				color: [0.12, 0.45, 0.15]
			}
		}
	});
}

function withDefaultResources(config: RenderConfig): RenderConfig {
	return {
		...config,
		geometrics: {
			...config.geometrics,
			...getDefaultGeometrics()
		},
		materials: {
			...config.materials,
			...getDefaultMaterials()
		},
		textures: {
			...config.textures,
			...getDefaultTextures()
		}
	};
}

function getDefaultGeometrics(): Record<string, GeometricData> {
	return {
		__unit_box: {
			type: 'box',
			a: [-0.5, 0.0, 0.5],
			b: [0.5, 1.0, -0.5],
			is_culled: false,
			material: '__lambertian_white'
		}
	};
}

function getDefaultMaterials(): Record<string, MaterialData> {
	return {
		__lambertian_white: {
			type: 'lambertian',
			reflectance_texture: '__white',
			emittance_texture: '__black'
		},
		__lambertian_black: {
			type: 'lambertian',
			reflectance_texture: '__black',
			emittance_texture: '__black'
		}
	};
}

function getDefaultTextures(): Record<string, TextureData> {
	return {
		__white: {
			type: 'color',
			color: [1.0, 1.0, 1.0]
		},
		__black: {
			type: 'color',
			color: [0.0, 0.0, 0.0]
		}
	};
}
