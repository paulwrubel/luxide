import type { RenderConfig } from './render';

export function getDefaultRenderConfig(): RenderConfig {
	return getCornellBoxRenderConfig();
}

export function getCornellBoxRenderConfig(): RenderConfig {
	return {
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
		active_scene: {
			geometrics: ['Room', 'Far Left Box', 'Near Right Box'],
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
		},
		geometrics: {
			'Left Wall': {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [0.0, 0.0, -1.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'Green'
			},
			'Right Wall': {
				type: 'parallelogram',
				lower_left: [1.0, 0.0, -1.0],
				u: [0.0, 0.0, 1.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'Red'
			},
			Floor: {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, 0.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 0.0, -1.0],
				is_culled: false,
				material: 'White'
			},
			Ceiling: {
				type: 'parallelogram',
				lower_left: [0.0, 1.0, -1.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 0.0, 1.0],
				is_culled: false,
				material: 'White'
			},
			'Far Wall': {
				type: 'parallelogram',
				lower_left: [0.0, 0.0, -1.0],
				u: [1.0, 0.0, 0.0],
				v: [0.0, 1.0, 0.0],
				is_culled: false,
				material: 'White'
			},
			'Near Wall': {
				type: 'parallelogram',
				lower_left: [1.0, 0.0, 0.0],
				u: [-1.0, 0.0, 0.0],
				v: [0.0, 1.0, 0.0],
				is_culled: true,
				material: 'White'
			},
			'Ceiling Light': {
				type: 'parallelogram',
				lower_left: [0.35, 0.999, -0.65],
				u: [0.3, 0.0, 0.0],
				v: [0.0, 0.0, 0.3],
				is_culled: false,
				material: 'White Light'
			},
			Room: {
				type: 'list',
				geometrics: [
					'Left Wall',
					'Right Wall',
					'Floor',
					'Ceiling',
					'Ceiling Light',
					'Far Wall',
					'Near Wall'
				],
				use_bvh: true
			},
			'Far Left Box': {
				type: 'rotate_y',
				geometric: {
					type: 'box',
					a: [0.2, 0.0, -0.5],
					b: [0.5, 0.6, -0.8],
					is_culled: false,
					material: 'White'
				},
				degrees: 15.0,
				around: [0.35, 0.0, -0.65]
			},
			'Near Right Box': {
				type: 'rotate_y',
				geometric: {
					type: 'box',
					a: [0.5, 0.0, -0.2],
					b: [0.8, 0.3, -0.5],
					is_culled: false,
					material: 'White'
				},
				degrees: 342.0,
				around: [0.65, 0.0, -0.35]
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
	};
}
