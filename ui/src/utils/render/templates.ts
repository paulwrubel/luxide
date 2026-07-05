import type { NormalizedRenderConfig } from './config';
import type { GeometricData } from './geometric';
import type { MaterialData } from './material';
import type { TextureData } from './texture';

export type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  config: NormalizedRenderConfig;
};

export const TEMPLATES: Template[] = [
  {
    id: 'cornell-box-base',
    name: 'Cornell Box — Empty',
    description:
      'Empty Cornell Box scene with colored walls and a ceiling light — ready to customize',
    thumbnail: '/templates/cornell-box-empty.png',
    config: getCornellBoxBaseRenderConfig(),
  },
  {
    id: 'cornell-box',
    name: 'Cornell Box',
    description: 'Classic Cornell Box scene with two boxes, colored walls, and a ceiling light',
    thumbnail: '/templates/cornell-box.png',
    config: getCornellBoxRenderConfig(),
  },
  {
    id: 'cornell-box-mirror-spheres',
    name: 'Cornell Box — Mirror Spheres',
    description: 'Cornell Box scene with two mirror-reflective spheres instead of boxes',
    thumbnail: '/templates/cornell-box-mirror-spheres.png',
    config: getCornellBoxMirrorSpheresRenderConfig(),
  },
  {
    id: 'cornell-box-glass-spheres',
    name: 'Cornell Box — Glass Spheres',
    description: 'Cornell Box scene with two dielectric glass spheres instead of boxes',
    thumbnail: '/templates/cornell-box-glass-spheres.png',
    config: getCornellBoxGlassSpheresRenderConfig(),
  },
  {
    id: 'empty',
    name: 'Empty',
    description: 'Blank canvas with default parameters — build your scene from scratch',
    config: getEmptyRenderConfig(),
  },
];

export function getDefaultRenderConfig(): NormalizedRenderConfig {
  return getCornellBoxRenderConfig();
}

export function getEmptyRenderConfig(): NormalizedRenderConfig {
  return withDefaultResources({
    name: 'Empty',
    parameters: {
      image_dimensions: [500, 500],
      tile_dimensions: [1, 1],
      gamma_correction: 2.0,
      samples_per_checkpoint: 16,
      total_checkpoints: 100,
      saved_checkpoint_limit: 1,
      use_scaling_truncation: true,
      bounces: {
        max: 50,
        use_russian_roulette_after: 3,
      },
      importance_sampling: {
        brdf_weight: 1.0,
        emissive_weight: 1.0,
        transmissive_weight: 0.0,
        specular_weight: 0.0,
        virtual_weight: 0.0,
        use_multiple_importance_sampling: true,
      },
    },
    active_scene: 'Main',
    scenes: {
      Main: {
        geometrics: [],
        use_bvh: true,
        camera: 'Main Camera',
        background_color: [0.0, 0.0, 0.0],
      },
    },
    cameras: {
      'Main Camera': {
        vertical_field_of_view_degrees: 40.0,
        eye_location: [0.0, 0.0, -10.0],
        target_location: [0.0, 0.0, 0.0],
        view_up: [0.0, 1.0, 0.0],
        defocus_angle_degrees: 0.0,
        focus_distance: 'eye_to_target',
      },
    },
    geometrics: {},
    materials: {},
    textures: {},
  });
}

export function getCornellBoxRenderConfig(): NormalizedRenderConfig {
  const base = getCornellBoxBaseRenderConfig();
  const scenes = base.scenes!;
  return {
    ...base,
    name: 'Cornell Box',
    scenes: {
      ...scenes,
      'Cornell Box': {
        ...scenes['Cornell Box'],
        geometrics: [
          'Far Left Box - Rotate Y',
          'Near Right Box - Rotate Y',
          ...scenes['Cornell Box'].geometrics,
        ],
      },
    },
    geometrics: {
      'Far Left Box - Rotate Y': {
        type: 'rotate_y',
        geometric: 'Far Left Box',
        degrees: 15.0,
        around: 'center',
      },
      'Far Left Box': {
        type: 'box',
        a: [2.0, 0.0, -5.0],
        b: [5.0, 6.0, -8.0],
        is_culled: false,
        material: 'White',
      },
      'Near Right Box - Rotate Y': {
        type: 'rotate_y',
        geometric: 'Near Right Box',
        degrees: 342.0,
        around: 'center',
      },
      'Near Right Box': {
        type: 'box',
        a: [5.0, 0.0, -2.0],
        b: [8.0, 3.0, -5.0],
        is_culled: false,
        material: 'White',
      },
      ...base.geometrics,
    },
  };
}

export function getCornellBoxMirrorSpheresRenderConfig(): NormalizedRenderConfig {
  const base = getCornellBoxBaseRenderConfig();
  const scenes = base.scenes!;
  return {
    ...base,
    name: 'Cornell Box — Mirror Spheres',
    scenes: {
      ...scenes,
      'Cornell Box': {
        ...scenes['Cornell Box'],
        geometrics: ['Far Left Sphere', 'Near Right Sphere', ...scenes['Cornell Box'].geometrics],
      },
    },
    geometrics: {
      'Far Left Sphere': {
        type: 'sphere',
        center: [3.0, 2.0, -7.0],
        radius: 2.0,
        material: 'Mirror',
      },
      'Near Right Sphere': {
        type: 'sphere',
        center: [7.5, 1.5, -2.5],
        radius: 1.5,
        material: 'Mirror',
      },
      ...base.geometrics,
    },
    materials: {
      Mirror: {
        type: 'specular',
        reflectance_texture: 'White',
        emittance_texture: 'Black',
        roughness: 0,
      },
      ...base.materials,
    },
  };
}

export function getCornellBoxGlassSpheresRenderConfig(): NormalizedRenderConfig {
  const base = getCornellBoxBaseRenderConfig();
  const scenes = base.scenes!;
  return {
    ...base,
    name: 'Cornell Box — Glass Spheres',
    scenes: {
      ...scenes,
      'Cornell Box': {
        ...scenes['Cornell Box'],
        geometrics: ['Far Left Sphere', 'Near Right Sphere', ...scenes['Cornell Box'].geometrics],
      },
    },
    geometrics: {
      'Far Left Sphere': {
        type: 'sphere',
        center: [3.0, 2.0, -7.0],
        radius: 2.0,
        material: 'Glass',
      },
      'Near Right Sphere': {
        type: 'sphere',
        center: [7.5, 1.5, -2.5],
        radius: 1.5,
        material: 'Glass',
      },
      ...base.geometrics,
    },
    materials: {
      Glass: {
        type: 'dielectric',
        reflectance_texture: 'White',
        emittance_texture: 'Black',
        index_of_refraction: 1.5,
      },
      ...base.materials,
    },
  };
}

export function getCornellBoxBaseRenderConfig(): NormalizedRenderConfig {
  return withDefaultResources({
    name: 'Cornell Box — Empty',
    parameters: {
      image_dimensions: [500, 500],
      tile_dimensions: [1, 1],
      gamma_correction: 2.0,
      samples_per_checkpoint: 16,
      total_checkpoints: 100,
      saved_checkpoint_limit: 1,
      use_scaling_truncation: true,
      bounces: {
        max: 50,
        use_russian_roulette_after: 3,
      },
      importance_sampling: {
        brdf_weight: 1.0,
        emissive_weight: 1.0,
        transmissive_weight: 0.0,
        specular_weight: 0.0,
        virtual_weight: 0.0,
        use_multiple_importance_sampling: true,
      },
    },
    active_scene: 'Cornell Box',
    scenes: {
      'Cornell Box': {
        geometrics: ['Walls', 'Ceiling Light'],
        use_bvh: true,
        camera: 'Main Camera',
        background_color: [0.0, 0.0, 0.0],
      },
    },
    cameras: {
      'Main Camera': {
        vertical_field_of_view_degrees: 40.0,
        eye_location: [5.0, 5.0, 14.4144],
        target_location: [5.0, 5.0, 0.0],
        view_up: [0.0, 1.0, 0.0],
        defocus_angle_degrees: 0.0,
        focus_distance: 'eye_to_target',
      },
    },
    geometrics: {
      'Ceiling Light': {
        type: 'parallelogram',
        lower_left: [3.5, 9.99, -6.5],
        u: [3.0, 0.0, 0.0],
        v: [0.0, 0.0, 3.0],
        is_culled: false,
        material: 'White Light',
      },
      Walls: {
        type: 'list',
        geometrics: ['Left Wall', 'Right Wall', 'Floor', 'Ceiling', 'Far Wall', 'Near Wall'],
      },
      'Left Wall': {
        type: 'parallelogram',
        lower_left: [0.0, 0.0, 0.0],
        u: [0.0, 0.0, -10.0],
        v: [0.0, 10.0, 0.0],
        is_culled: false,
        material: 'Green',
      },
      'Right Wall': {
        type: 'parallelogram',
        lower_left: [10.0, 0.0, -10.0],
        u: [0.0, 0.0, 10.0],
        v: [0.0, 10.0, 0.0],
        is_culled: false,
        material: 'Red',
      },
      Floor: {
        type: 'parallelogram',
        lower_left: [0.0, 0.0, 0.0],
        u: [10.0, 0.0, 0.0],
        v: [0.0, 0.0, -10.0],
        is_culled: false,
        material: 'White',
      },
      Ceiling: {
        type: 'parallelogram',
        lower_left: [0.0, 10.0, -10.0],
        u: [10.0, 0.0, 0.0],
        v: [0.0, 0.0, 10.0],
        is_culled: false,
        material: 'White',
      },
      'Far Wall': {
        type: 'parallelogram',
        lower_left: [0.0, 0.0, -10.0],
        u: [10.0, 0.0, 0.0],
        v: [0.0, 10.0, 0.0],
        is_culled: false,
        material: 'White',
      },
      'Near Wall': {
        type: 'parallelogram',
        lower_left: [10.0, 0.0, 0.0],
        u: [-10.0, 0.0, 0.0],
        v: [0.0, 10.0, 0.0],
        is_culled: true,
        material: 'White',
      },
    },
    materials: {
      White: {
        type: 'lambertian',
        reflectance_texture: 'White',
        emittance_texture: 'Black',
      },
      Red: {
        type: 'lambertian',
        reflectance_texture: 'Red',
        emittance_texture: 'Black',
      },
      Green: {
        type: 'lambertian',
        reflectance_texture: 'Green',
        emittance_texture: 'Black',
      },
      'White Light': {
        type: 'lambertian',
        reflectance_texture: 'Black',
        emittance_texture: 'White Light',
      },
    },
    textures: {
      Black: {
        type: 'color',
        color: [0.0, 0.0, 0.0],
      },
      White: {
        type: 'color',
        color: [0.73, 0.73, 0.73],
      },
      Red: {
        type: 'color',
        color: [0.65, 0.05, 0.05],
      },
      Green: {
        type: 'color',
        color: [0.12, 0.45, 0.15],
      },
      'White Light': {
        type: 'color',
        color: [7.0, 7.0, 7.0],
      },
    },
  });
}

export function withDefaultResources(config: NormalizedRenderConfig): NormalizedRenderConfig {
  return {
    ...config,
    geometrics: {
      ...config.geometrics,
      ...getDefaultGeometrics(),
    },
    materials: {
      ...config.materials,
      ...getDefaultMaterials(),
    },
    textures: {
      ...config.textures,
      ...getDefaultTextures(),
    },
  };
}

function getDefaultGeometrics(): Record<string, GeometricData> {
  return {
    __unit_box: {
      type: 'box',
      a: [-0.5, 0.0, 0.5],
      b: [0.5, 1.0, -0.5],
      is_culled: false,
      material: '__lambertian_white',
    },
  };
}

function getDefaultMaterials(): Record<string, MaterialData> {
  return {
    __lambertian_white: {
      type: 'lambertian',
      reflectance_texture: '__white',
      emittance_texture: '__black',
    },
    __lambertian_black: {
      type: 'lambertian',
      reflectance_texture: '__black',
      emittance_texture: '__black',
    },
  };
}

function getDefaultTextures(): Record<string, TextureData> {
  return {
    __white: {
      type: 'color',
      color: [1.0, 1.0, 1.0],
    },
    __black: {
      type: 'color',
      color: [0.0, 0.0, 0.0],
    },
  };
}
