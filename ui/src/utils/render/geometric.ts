import type { NormalizedRenderConfig, RenderConfig } from './config';
import { normalizeMaterialData, type RawMaterialData } from './material';
import { normalizeTextureData, type RawTextureData } from './texture';
import {
  AngleSchema,
  AroundSchema,
  getNextUniqueName,
  isAroundCenter,
  isAroundOrigin,
  isTypedObject,
  nonZeroNumber,
  toRadians,
  type Angle,
  type Around,
} from './utils';
import { z } from 'zod';

// geometric types
export type GeometricData = NormalizedGeometricData;

export function normalizeGeometricData(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricData,
): NormalizedGeometricData {
  switch (geometricData.type) {
    case 'box':
      return normalizeGeometricBox(config, name, geometricData);
    case 'list':
      return normalizeGeometricList(config, name, geometricData);
    case 'obj_model':
      return normalizeGeometricObjModel(config, name, geometricData);
    case 'rotate_x':
      return normalizeGeometricInstanceRotate(config, name, geometricData);
    case 'rotate_y':
      return normalizeGeometricInstanceRotate(config, name, geometricData);
    case 'rotate_z':
      return normalizeGeometricInstanceRotate(config, name, geometricData);
    case 'scale':
      return normalizeGeometricInstanceScale(config, name, geometricData);
    case 'translate':
      return normalizeGeometricInstanceTranslate(config, name, geometricData);
    case 'parallelogram':
      return normalizeGeometricParallelogram(config, name, geometricData);
    case 'plane':
      return normalizeGeometricPlane(config, name, geometricData);
    case 'sphere':
      return normalizeGeometricSphere(config, name, geometricData);
    case 'triangle':
      return normalizeGeometricTriangle(config, name, geometricData);
    case 'constant_volume':
      return normalizeGeometricConstantVolume(config, name, geometricData);
    case 'virtual':
      return normalizeGeometricVirtual(config, name, geometricData);
    case 'disk':
      return normalizeGeometricDisk(config, name, geometricData);
    case 'bilinear_patch':
      return normalizeGeometricBilinearPatch(config, name, geometricData);
    case 'cylinder':
      return normalizeGeometricCylinder(config, name, geometricData);
  }
}

export type NormalizedGeometricData =
  | NormalizedGeometricBox
  | NormalizedGeometricList
  | NormalizedGeometricObjModel
  | NormalizedGeometricInstanceRotate
  | NormalizedGeometricInstanceScale
  | NormalizedGeometricInstanceTranslate
  | NormalizedGeometricParallelogram
  | NormalizedGeometricPlane
  | NormalizedGeometricSphere
  | NormalizedGeometricTriangle
  | NormalizedGeometricConstantVolume
  | NormalizedGeometricVirtual
  | NormalizedGeometricDisk
  | NormalizedGeometricBilinearPatch
  | NormalizedGeometricCylinder;

export type RawGeometricData =
  | RawGeometricBox
  | RawGeometricList
  | RawGeometricObjModel
  | RawGeometricInstanceRotate
  | RawGeometricInstanceScale
  | RawGeometricInstanceTranslate
  | RawGeometricParallelogram
  | RawGeometricPlane
  | RawGeometricSphere
  | RawGeometricTriangle
  | RawGeometricConstantVolume
  | RawGeometricVirtual
  | RawGeometricDisk
  | RawGeometricBilinearPatch
  | RawGeometricCylinder;

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
      'scale',
      'translate',
      'parallelogram',
      'plane',
      'sphere',
      'triangle',
      'disk',
      'bilinear_patch',
      'cylinder',
      'constant_volume',
      'virtual',
    ].includes(data.type)
  );
}

export function isComposite(
  data: GeometricData,
): data is
  | GeometricList
  | GeometricInstanceRotate
  | GeometricInstanceScale
  | GeometricInstanceTranslate {
  return (
    data.type === 'list' ||
    data.type === 'rotate_x' ||
    data.type === 'rotate_y' ||
    data.type === 'rotate_z' ||
    data.type === 'scale' ||
    data.type === 'translate' ||
    data.type === 'virtual'
  );
}

export function getReferencedMaterialNames(
  config: NormalizedRenderConfig,
  geometricName: string,
): string[] {
  const { data } = getGeometricData(config, geometricName);
  const materials: string[] = [];
  switch (data.type) {
    case 'box':
    case 'cylinder':
    case 'disk':
    case 'bilinear_patch':
    case 'obj_model':
    case 'parallelogram':
    case 'plane':
    case 'sphere':
    case 'triangle':
      materials.push(data.material);
      break;
    case 'list':
      materials.push(
        ...data.geometrics.flatMap((subGeometricName) =>
          getReferencedMaterialNames(config, subGeometricName),
        ),
      );
      break;
    case 'rotate_x':
    case 'rotate_y':
    case 'rotate_z':
    case 'scale':
    case 'translate':
    case 'constant_volume':
    case 'virtual':
      materials.push(...getReferencedMaterialNames(config, data.geometric));
      break;
  }

  return [...new Set(materials)];
}

// rotate a point around a pivot by angleRad radians on the given axis.
// matches the Rust backend's RotateXAxis / RotateYAxis / RotateZAxis conventions.
function rotatePoint(
  point: [number, number, number],
  axis: 'rotate_x' | 'rotate_y' | 'rotate_z',
  angleRad: number,
  pivot: [number, number, number],
): [number, number, number] {
  const [px, py, pz] = pivot;
  const vx = point[0] - px;
  const vy = point[1] - py;
  const vz = point[2] - pz;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  let rx: number;
  let ry: number;
  let rz: number;

  switch (axis) {
    case 'rotate_x':
      // rotation in YZ plane: y' = y*cos - z*sin, z' = y*sin + z*cos
      rx = vx;
      ry = vy * cosA - vz * sinA;
      rz = vy * sinA + vz * cosA;
      break;
    case 'rotate_y':
      // rotation in XZ plane: x' = x*cos + z*sin, z' = -x*sin + z*cos
      rx = vx * cosA + vz * sinA;
      ry = vy;
      rz = -vx * sinA + vz * cosA;
      break;
    case 'rotate_z':
      // rotation in XY plane: x' = x*cos - y*sin, y' = x*sin + y*cos
      rx = vx * cosA - vy * sinA;
      ry = vx * sinA + vy * cosA;
      rz = vz;
      break;
  }

  return [rx + px, ry + py, rz + pz];
}

// resolve an Around variant to a concrete [x, y, z] pivot point.
// for Center, computes the child geometric's center.
export function getAroundPoint(
  around: Around,
  config: NormalizedRenderConfig,
  childGeometricName: string,
): [number, number, number] {
  if (isAroundCenter(around)) {
    const { data: childData } = getGeometricDataSafe(config, childGeometricName);
    return getCenterPoint(config, childData);
  }
  if (isAroundOrigin(around)) {
    return [0, 0, 0];
  }
  return around.point;
}

export function getCenterPoint(
  config: NormalizedRenderConfig,
  data: GeometricData,
): [number, number, number] {
  switch (data.type) {
    case 'box':
      return [
        (data.a[0] + data.b[0]) / 2,
        (data.a[1] + data.b[1]) / 2,
        (data.a[2] + data.b[2]) / 2,
      ];
    case 'list': {
      const points = data.geometrics.map((geometricName) => {
        const { data: subData } = getGeometricDataSafe(config, geometricName);
        return getCenterPoint(config, subData);
      });

      return points.reduce(
        (acc, point) => [(acc[0] + point[0]) / 2, (acc[1] + point[1]) / 2, (acc[2] + point[2]) / 2],
        [0, 0, 0],
      );
    }
    case 'obj_model':
      return data.origin ?? [0, 0, 0];
    case 'rotate_x':
    case 'rotate_y':
    case 'rotate_z': {
      const { data: subData } = getGeometricDataSafe(config, data.geometric);
      const childCenter = getCenterPoint(config, subData);
      const angleRad = toRadians(data);
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return rotatePoint(childCenter, data.type, angleRad, pivot);
    }
    case 'scale': {
      const { data: subData } = getGeometricDataSafe(config, data.geometric);
      const childCenter = getCenterPoint(config, subData);
      const pivot = getAroundPoint(data.around, config, data.geometric);
      return [
        pivot[0] + (childCenter[0] - pivot[0]) * data.scale[0],
        pivot[1] + (childCenter[1] - pivot[1]) * data.scale[1],
        pivot[2] + (childCenter[2] - pivot[2]) * data.scale[2],
      ];
    }
    case 'translate': {
      const { data: subData } = getGeometricDataSafe(config, data.geometric);
      const childCenter = getCenterPoint(config, subData);
      return [
        childCenter[0] + data.translation[0],
        childCenter[1] + data.translation[1],
        childCenter[2] + data.translation[2],
      ];
    }
    case 'parallelogram':
      return [
        data.lower_left[0] + (data.u[0] + data.v[0]) / 2,
        data.lower_left[1] + (data.u[1] + data.v[1]) / 2,
        data.lower_left[2] + (data.u[2] + data.v[2]) / 2,
      ];
    case 'plane':
      return data.point;
    case 'sphere':
      return data.center;
    case 'triangle':
      return [
        (data.a[0] + data.b[0] + data.c[0]) / 3,
        (data.a[1] + data.b[1] + data.c[1]) / 3,
        (data.a[2] + data.b[2] + data.c[2]) / 3,
      ];
    case 'disk':
      return data.center;
    case 'cylinder':
      return [
        (data.a[0] + data.b[0]) / 2,
        (data.a[1] + data.b[1]) / 2,
        (data.a[2] + data.b[2]) / 2,
      ];
    case 'bilinear_patch':
      return [
        (data.p00[0] + data.p10[0] + data.p01[0] + data.p11[0]) / 4,
        (data.p00[1] + data.p10[1] + data.p01[1] + data.p11[1]) / 4,
        (data.p00[2] + data.p10[2] + data.p01[2] + data.p11[2]) / 4,
      ];
    case 'constant_volume':
    case 'virtual': {
      const { data: subData } = getGeometricDataSafe(config, data.geometric);
      return getCenterPoint(config, subData);
    }
  }
}

export type GeometricDataResult = {
  data: GeometricData;
  source: 'reference' | 'inline' | 'default';
  name?: string;
};

export function getGeometricDataSafe(
  config: NormalizedRenderConfig,
  nameOrData: string | GeometricData,
): GeometricDataResult {
  try {
    return getGeometricData(config, nameOrData);
  } catch (e) {
    console.warn(`Failed to get geometric data (${nameOrData}), using default geometric`, e);
    return {
      data: defaultGeometricForType('box'),
      source: 'default',
    };
  }
}

export function getGeometricData(
  config: NormalizedRenderConfig,
  nameOrData: string | GeometricData,
): GeometricDataResult {
  if (isGeometricData(nameOrData)) {
    return {
      data: nameOrData,
      source: 'inline',
    };
  }

  const geometric = config.geometrics?.[nameOrData];
  if (!geometric) {
    throw new Error(`Geometric ${nameOrData} not found`);
  }

  return {
    data: geometric,
    source: 'reference',
    name: nameOrData,
  };
}

// function overloads for compile-time type checking
export function defaultGeometricForType(
  type: 'obj_model',
  options: { filename: string },
): GeometricObjModel;
export function defaultGeometricForType(
  type: Exclude<GeometricData['type'], 'obj_model'>,
): GeometricData;

// implementation
export function defaultGeometricForType(
  type: GeometricData['type'],
  options?: { filename: string },
): GeometricData {
  switch (type) {
    case 'box':
      return {
        type: 'box',
        a: [-0.5, -0.5, 0.5],
        b: [0.5, 0.5, -0.5],
        material: '__lambertian_white',
      };
    case 'list':
      return {
        type: 'list',
        geometrics: [],
      };
    case 'obj_model':
      if (!options || options.filename.length === 0) {
        throw new Error('filename option required for obj_model');
      }
      return {
        type: 'obj_model',
        filename: options.filename,
        origin: [0, 0, 0],
        scale: 1,
        recalculate_normals: false,
        use_bvh: true,
        material: '__lambertian_white',
      };
    case 'rotate_x':
      return {
        type: 'rotate_x',
        geometric: '__unit_box',
        degrees: 0,
        around: 'center',
      };
    case 'rotate_y':
      return {
        type: 'rotate_y',
        geometric: '__unit_box',
        degrees: 0,
        around: 'center',
      };
    case 'rotate_z':
      return {
        type: 'rotate_z',
        geometric: '__unit_box',
        degrees: 0,
        around: 'center',
      };
    case 'scale':
      return {
        type: 'scale',
        geometric: '__unit_box',
        scale: [1, 1, 1],
        around: 'center',
      };
    case 'translate':
      return {
        type: 'translate',
        geometric: '__unit_box',
        translation: [0, 0, 0],
      };
    case 'parallelogram':
      return {
        type: 'parallelogram',
        lower_left: [-0.5, -0.5, 0],
        u: [1, 0, 0],
        v: [0, 1, 0],
        material: '__lambertian_white',
      };
    case 'plane':
      return {
        type: 'plane',
        point: [0, 0, 0],
        normal: [0, 1, 0],
        material: '__lambertian_white',
      };
    case 'sphere':
      return {
        type: 'sphere',
        center: [0, 0, 0],
        radius: 1,
        material: '__lambertian_white',
      };
    case 'triangle':
      return {
        type: 'triangle',
        a: [-0.5, -0.5, 0],
        b: [0.5, -0.5, 0],
        c: [0, 0.5, 0],
        material: '__lambertian_white',
      };
    case 'constant_volume':
      return {
        type: 'constant_volume',
        density: 1,
        geometric: '__unit_box',
        reflectance_texture: '__white',
      };
    case 'virtual':
      return {
        type: 'virtual',
        geometric: '__unit_box',
      };
    case 'disk':
      return {
        type: 'disk',
        center: [0, 0, 0],
        normal: [0, 1, 0],
        radius: 1,
        inner_radius: 0,
        is_culled: false,
        material: '__lambertian_white',
      };
    case 'bilinear_patch':
      return {
        type: 'bilinear_patch',
        p00: [-0.5, 0, -0.5],
        p10: [0.5, 0, -0.5],
        p01: [-0.5, 0, 0.5],
        p11: [0.5, 0, 0.5],
        material: '__lambertian_white',
      };
    case 'cylinder':
      return {
        type: 'cylinder',
        a: [0, 0, 0],
        a_end: 'capped',
        b: [0, 1, 0],
        b_end: 'capped',
        radius: 1,
        material: '__lambertian_white',
      };
  }
}

export const GeometricBoxSchema = z.object({
  type: z.literal('box'),
  a: z.tuple([z.number(), z.number(), z.number()]),
  b: z.tuple([z.number(), z.number(), z.number()]),
  is_culled: z.boolean().nullish(),
  material: z.string().nonempty(),
});

export type GeometricBox = NormalizedGeometricBox;

export function normalizeGeometricBox(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricBox,
): NormalizedGeometricBox {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricBox;
}

export type NormalizedGeometricBox = Omit<RawGeometricBox, 'material'> & {
  material: string;
};

export type RawGeometricBox = {
  type: 'box';
  a: [number, number, number];
  b: [number, number, number];
  is_culled?: boolean;
  material: string | RawMaterialData;
};

export const GeometricListSchema = z.object({
  type: z.literal('list'),
  use_bvh: z.boolean().nullish(),
  geometrics: z.array(z.string().nonempty()),
});

export type GeometricList = NormalizedGeometricList;

export function normalizeGeometricList(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricList,
): NormalizedGeometricList {
  const geometric = geometricData;

  for (const [index, subGeometric] of geometric.geometrics.entries()) {
    if (typeof subGeometric !== 'string') {
      if (!config.geometrics) {
        config.geometrics = {};
      }

      const geometricName = getNextUniqueName(config.geometrics, `${name}_${subGeometric.type}`);
      config.geometrics[geometricName] = normalizeGeometricData(
        config,
        geometricName,
        subGeometric,
      );
      geometric.geometrics[index] = geometricName;
    }
  }

  return geometric as NormalizedGeometricList;
}

export type NormalizedGeometricList = Omit<RawGeometricList, 'geometrics'> & {
  geometrics: string[];
};

export type RawGeometricList = {
  type: 'list';
  use_bvh?: boolean;
  geometrics: (string | RawGeometricData)[];
};

export const GeometricObjModelSchema = z.object({
  type: z.literal('obj_model'),
  filename: z.string(),
  origin: z.tuple([z.number(), z.number(), z.number()]).nullish(),
  scale: z.number().nullish(),
  recalculate_normals: z.boolean().nullish(),
  use_bvh: z.boolean().nullish(),
  material: z.string().nonempty(),
});

export type GeometricObjModel = NormalizedGeometricObjModel;

export function normalizeGeometricObjModel(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricObjModel,
): NormalizedGeometricObjModel {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricObjModel;
}

export type NormalizedGeometricObjModel = Omit<RawGeometricObjModel, 'material'> & {
  material: string;
};

export type RawGeometricObjModel = {
  type: 'obj_model';
  filename: string;
  origin?: [number, number, number];
  scale?: number;
  recalculate_normals?: boolean;
  use_bvh?: boolean;
  material: string | RawMaterialData;
};

export const GeometricInstanceRotateXSchema = z
  .object({
    type: z.literal('rotate_x'),
    geometric: z.string().nonempty(),
    around: AroundSchema,
  })
  .and(AngleSchema);

export const GeometricInstanceRotateYSchema = z
  .object({
    type: z.literal('rotate_y'),
    geometric: z.string().nonempty(),
    around: AroundSchema,
  })
  .and(AngleSchema);

export const GeometricInstanceRotateZSchema = z
  .object({
    type: z.literal('rotate_z'),
    geometric: z.string().nonempty(),
    around: AroundSchema,
  })
  .and(AngleSchema);

export type GeometricInstanceRotate = NormalizedGeometricInstanceRotate;

export function normalizeGeometricInstanceRotate(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricInstanceRotate,
): NormalizedGeometricInstanceRotate {
  const geometric = geometricData;

  if (typeof geometric.geometric !== 'string') {
    if (!config.geometrics) {
      config.geometrics = {};
    }

    const geometricName = getNextUniqueName(
      config.geometrics,
      `${name}_${geometric.geometric.type}`,
    );
    config.geometrics[geometricName] = normalizeGeometricData(
      config,
      geometricName,
      geometric.geometric,
    );
    geometric.geometric = geometricName;
  }

  return geometric as NormalizedGeometricInstanceRotate;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends T ? Omit<T, K> : never;
export type NormalizedGeometricInstanceRotate = DistributiveOmit<
  RawGeometricInstanceRotate,
  'geometric'
> & {
  geometric: string;
};

export type RawGeometricInstanceRotate = {
  type: 'rotate_x' | 'rotate_y' | 'rotate_z';
  geometric: string | RawGeometricData;
  around: Around;
} & Angle;

export const GeometricInstanceTranslateSchema = z.object({
  type: z.literal('translate'),
  geometric: z.string().nonempty(),
  translation: z.tuple([z.number(), z.number(), z.number()]),
});

export type GeometricInstanceTranslate = NormalizedGeometricInstanceTranslate;

export function normalizeGeometricInstanceTranslate(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricInstanceTranslate,
): NormalizedGeometricInstanceTranslate {
  const geometric = geometricData;

  if (typeof geometric.geometric !== 'string') {
    if (!config.geometrics) {
      config.geometrics = {};
    }

    const geometricName = getNextUniqueName(
      config.geometrics,
      `${name}_${geometric.geometric.type}`,
    );
    config.geometrics[geometricName] = normalizeGeometricData(
      config,
      geometricName,
      geometric.geometric,
    );
    geometric.geometric = geometricName;
  }

  return geometric as NormalizedGeometricInstanceTranslate;
}

export type NormalizedGeometricInstanceTranslate = Omit<
  RawGeometricInstanceTranslate,
  'geometric'
> & {
  geometric: string;
};

export type RawGeometricInstanceTranslate = {
  type: 'translate';
  geometric: string | RawGeometricData;
  translation: [number, number, number];
};

export const GeometricInstanceScaleSchema = z.object({
  type: z.literal('scale'),
  geometric: z.string().nonempty(),
  scale: z.tuple([nonZeroNumber, nonZeroNumber, nonZeroNumber]),
  around: AroundSchema,
});

export type GeometricInstanceScale = NormalizedGeometricInstanceScale;

export function normalizeGeometricInstanceScale(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricInstanceScale,
): NormalizedGeometricInstanceScale {
  const geometric = geometricData;

  if (typeof geometric.geometric !== 'string') {
    if (!config.geometrics) {
      config.geometrics = {};
    }

    const geometricName = getNextUniqueName(
      config.geometrics,
      `${name}_${geometric.geometric.type}`,
    );
    config.geometrics[geometricName] = normalizeGeometricData(
      config,
      geometricName,
      geometric.geometric,
    );
    geometric.geometric = geometricName;
  }

  return geometric as NormalizedGeometricInstanceScale;
}

export type NormalizedGeometricInstanceScale = Omit<RawGeometricInstanceScale, 'geometric'> & {
  geometric: string;
};

export type RawGeometricInstanceScale = {
  type: 'scale';
  geometric: string | RawGeometricData;
  scale: [number, number, number];
  around: Around;
};

export const GeometricParallelogramSchema = z.object({
  type: z.literal('parallelogram'),
  lower_left: z.tuple([z.number(), z.number(), z.number()]),
  u: z.tuple([z.number(), z.number(), z.number()]),
  v: z.tuple([z.number(), z.number(), z.number()]),
  is_culled: z.boolean().nullish(),
  material: z.string().nonempty(),
});

export type GeometricParallelogram = NormalizedGeometricParallelogram;

export function normalizeGeometricParallelogram(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricParallelogram,
): NormalizedGeometricParallelogram {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricParallelogram;
}

export type NormalizedGeometricParallelogram = Omit<RawGeometricParallelogram, 'material'> & {
  material: string;
};

export type RawGeometricParallelogram = {
  type: 'parallelogram';
  lower_left: [number, number, number];
  u: [number, number, number];
  v: [number, number, number];
  is_culled?: boolean;
  material: string | RawMaterialData;
};

export const GeometricPlaneSchema = z.object({
  type: z.literal('plane'),
  point: z.tuple([z.number(), z.number(), z.number()]),
  normal: z.tuple([z.number(), z.number(), z.number()]),
  is_culled: z.boolean().optional(),
  material: z.string(),
});

export type GeometricPlane = NormalizedGeometricPlane;

export function normalizeGeometricPlane(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricPlane,
): NormalizedGeometricPlane {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricPlane;
}

export type NormalizedGeometricPlane = Omit<RawGeometricPlane, 'material'> & {
  material: string;
};

export type RawGeometricPlane = {
  type: 'plane';
  point: [number, number, number];
  normal: [number, number, number];
  is_culled?: boolean;
  material: string | RawMaterialData;
};

export const GeometricSphereSchema = z.object({
  type: z.literal('sphere'),
  center: z.tuple([z.number(), z.number(), z.number()]),
  radius: z.number().min(0),
  material: z.string().nonempty(),
});

export type GeometricSphere = NormalizedGeometricSphere;

export function normalizeGeometricSphere(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricSphere,
): NormalizedGeometricSphere {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricSphere;
}

export type NormalizedGeometricSphere = Omit<RawGeometricSphere, 'material'> & {
  material: string;
};

export type RawGeometricSphere = {
  type: 'sphere';
  center: [number, number, number];
  radius: number;
  material: string | RawMaterialData;
};

export const GeometricTriangleSchema = z.object({
  type: z.literal('triangle'),
  a: z.tuple([z.number(), z.number(), z.number()]),
  b: z.tuple([z.number(), z.number(), z.number()]),
  c: z.tuple([z.number(), z.number(), z.number()]),
  a_normal: z.tuple([z.number(), z.number(), z.number()]).nullish(),
  b_normal: z.tuple([z.number(), z.number(), z.number()]).nullish(),
  c_normal: z.tuple([z.number(), z.number(), z.number()]).nullish(),
  is_culled: z.boolean().nullish(),
  material: z.string().nonempty(),
});

export type GeometricTriangle = NormalizedGeometricTriangle;

export function normalizeGeometricTriangle(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricTriangle,
): NormalizedGeometricTriangle {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricTriangle;
}

export type NormalizedGeometricTriangle = Omit<RawGeometricTriangle, 'material'> & {
  material: string;
};

export type RawGeometricTriangle = {
  type: 'triangle';
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  a_normal?: [number, number, number];
  b_normal?: [number, number, number];
  c_normal?: [number, number, number];
  is_culled?: boolean;
  material: string | RawMaterialData;
};

export const GeometricConstantVolumeSchema = z.object({
  type: z.literal('constant_volume'),
  geometric: z.string().nonempty(),
  density: z.number().min(0),
  reflectance_texture: z.string().nonempty(),
});

export type GeometricConstantVolume = NormalizedGeometricConstantVolume;

export function normalizeGeometricConstantVolume(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricConstantVolume,
): NormalizedGeometricConstantVolume {
  const geometric = geometricData;

  if (typeof geometric.geometric !== 'string') {
    if (!config.geometrics) {
      config.geometrics = {};
    }

    const geometricName = getNextUniqueName(
      config.geometrics,
      `${name}_${geometric.geometric.type}`,
    );
    config.geometrics[geometricName] = normalizeGeometricData(
      config,
      geometricName,
      geometric.geometric,
    );
    geometric.geometric = geometricName;
  }

  if (typeof geometric.reflectance_texture !== 'string') {
    if (!config.textures) {
      config.textures = {};
    }

    const textureName = getNextUniqueName(
      config.textures,
      `${name}_${geometric.reflectance_texture.type}`,
    );
    config.textures[textureName] = normalizeTextureData(
      config,
      textureName,
      geometric.reflectance_texture,
    );
    geometric.reflectance_texture = textureName;
  }

  return geometric as NormalizedGeometricConstantVolume;
}

export type NormalizedGeometricConstantVolume = Omit<
  RawGeometricConstantVolume,
  'geometric' | 'reflectance_texture'
> & {
  geometric: string;
  reflectance_texture: string;
};

export type RawGeometricConstantVolume = {
  type: 'constant_volume';
  geometric: string | RawGeometricData;
  density: number;
  reflectance_texture: string | RawTextureData;
};

export type RawGeometricVirtual = {
  type: 'virtual';
  geometric: string | RawGeometricData;
};

export type NormalizedGeometricVirtual = Omit<RawGeometricVirtual, 'geometric'> & {
  geometric: string;
};

export const GeometricVirtualSchema = z.object({
  type: z.literal('virtual'),
  geometric: z.string().nonempty(),
});

export type GeometricVirtual = NormalizedGeometricVirtual;

export function normalizeGeometricVirtual(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricVirtual,
): NormalizedGeometricVirtual {
  const geometric = geometricData;

  if (typeof geometric.geometric !== 'string') {
    if (!config.geometrics) {
      config.geometrics = {};
    }

    const geometricName = getNextUniqueName(
      config.geometrics,
      `${name}_${geometric.geometric.type}`,
    );
    config.geometrics[geometricName] = normalizeGeometricData(
      config,
      geometricName,
      geometric.geometric,
    );
    geometric.geometric = geometricName;
  }

  return geometric as NormalizedGeometricVirtual;
}

export const GeometricDiskSchema = z
  .object({
    type: z.literal('disk'),
    center: z.tuple([z.number(), z.number(), z.number()]),
    normal: z.tuple([z.number(), z.number(), z.number()]),
    radius: z.number().positive(),
    inner_radius: z.number().min(0).optional().default(0),
    is_culled: z.boolean().nullish(),
    material: z.string().nonempty(),
  })
  .refine(({ inner_radius, radius }) => (inner_radius ?? 0.0) < radius, {
    message: 'Inner radius must be less than the outer radius',
    path: ['inner_radius'],
  });

export type GeometricDisk = NormalizedGeometricDisk;

export function normalizeGeometricDisk(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricDisk,
): NormalizedGeometricDisk {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricDisk;
}

export type NormalizedGeometricDisk = Omit<RawGeometricDisk, 'material'> & {
  material: string;
};

export type RawGeometricDisk = {
  type: 'disk';
  center: [number, number, number];
  normal: [number, number, number];
  radius: number;
  inner_radius?: number;
  is_culled?: boolean;
  material: string | RawMaterialData;
};

export const GeometricBilinearPatchSchema = z.object({
  type: z.literal('bilinear_patch'),
  p00: z.tuple([z.number(), z.number(), z.number()]),
  p10: z.tuple([z.number(), z.number(), z.number()]),
  p01: z.tuple([z.number(), z.number(), z.number()]),
  p11: z.tuple([z.number(), z.number(), z.number()]),
  material: z.string().nonempty(),
});

export type GeometricBilinearPatch = NormalizedGeometricBilinearPatch;

export function normalizeGeometricBilinearPatch(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricBilinearPatch,
): NormalizedGeometricBilinearPatch {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricBilinearPatch;
}

export type NormalizedGeometricBilinearPatch = Omit<RawGeometricBilinearPatch, 'material'> & {
  material: string;
};

export type RawGeometricBilinearPatch = {
  type: 'bilinear_patch';
  p00: [number, number, number];
  p10: [number, number, number];
  p01: [number, number, number];
  p11: [number, number, number];
  material: string | RawMaterialData;
};

const CylinderEndSchema = z.enum(['capped', 'open', 'infinite']);

export const GeometricCylinderSchema = z
  .object({
    type: z.literal('cylinder'),
    a: z.tuple([z.number(), z.number(), z.number()]),
    a_end: CylinderEndSchema,
    b: z.tuple([z.number(), z.number(), z.number()]),
    b_end: CylinderEndSchema,
    radius: z.number().positive(),
    material: z.string().nonempty(),
  })
  .refine(
    (data) => {
      const dx = data.b[0] - data.a[0];
      const dy = data.b[1] - data.a[1];
      const dz = data.b[2] - data.a[2];
      return dx * dx + dy * dy + dz * dz > 1e-12;
    },
    {
      message: 'Points a and b must be different',
    },
  );

export type GeometricCylinder = NormalizedGeometricCylinder;

export function normalizeGeometricCylinder(
  config: RenderConfig,
  name: string,
  geometricData: RawGeometricCylinder,
): NormalizedGeometricCylinder {
  const geometric = geometricData;

  if (typeof geometric.material !== 'string') {
    if (!config.materials) {
      config.materials = {};
    }

    const materialName = getNextUniqueName(config.materials, `${name}_${geometric.material.type}`);
    config.materials[materialName] = normalizeMaterialData(
      config,
      materialName,
      geometric.material,
    );
    geometric.material = materialName;
  }

  return geometric as NormalizedGeometricCylinder;
}

export type NormalizedGeometricCylinder = Omit<RawGeometricCylinder, 'material'> & {
  material: string;
};

export type RawGeometricCylinder = {
  type: 'cylinder';
  a: [number, number, number];
  a_end: 'capped' | 'open' | 'infinite';
  b: [number, number, number];
  b_end: 'capped' | 'open' | 'infinite';
  radius: number;
  material: string | RawMaterialData;
};

const geometricSchemaByType: Record<string, z.ZodTypeAny> = {
  box: GeometricBoxSchema,
  list: GeometricListSchema,
  obj_model: GeometricObjModelSchema,
  rotate_x: GeometricInstanceRotateXSchema,
  rotate_y: GeometricInstanceRotateYSchema,
  rotate_z: GeometricInstanceRotateZSchema,
  scale: GeometricInstanceScaleSchema,
  translate: GeometricInstanceTranslateSchema,
  parallelogram: GeometricParallelogramSchema,
  disk: GeometricDiskSchema,
  plane: GeometricPlaneSchema,
  sphere: GeometricSphereSchema,
  triangle: GeometricTriangleSchema,
  constant_volume: GeometricConstantVolumeSchema,
  virtual: GeometricVirtualSchema,
  bilinear_patch: GeometricBilinearPatchSchema,
  cylinder: GeometricCylinderSchema,
};

export const GeometricDataSchema = z.any().superRefine((data, ctx) => {
  if (typeof data !== 'object' || data === null || !('type' in data)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Geometric data must be an object with a type field',
    });
    return;
  }

  const schema = geometricSchemaByType[data.type as string];
  if (!schema) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unknown geometric type: ${data.type}`,
    });
    return;
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue(issue);
    }
  }
}) as z.ZodType<NormalizedGeometricData>;

export function wrapGeometric(
  config: NormalizedRenderConfig,
  geometricName: string,
  wrapperType:
    | 'rotate_x'
    | 'rotate_y'
    | 'rotate_z'
    | 'scale'
    | 'translate'
    | 'constant_volume'
    | 'virtual',
): { config: NormalizedRenderConfig; wrapperName: string } {
  const geometrics = config.geometrics;
  if (!geometrics || !(geometricName in geometrics)) {
    return { config, wrapperName: geometricName };
  }

  const typeLabels: Record<string, string> = {
    box: 'Box',
    bilinear_patch: 'Bilinear Patch',
    cylinder: 'Cylinder',
    sphere: 'Sphere',
    triangle: 'Triangle',
    parallelogram: 'Parallelogram',
    disk: 'Disk',
    obj_model: 'OBJ Model',
    list: 'List',
    rotate_x: 'Rotate X',
    rotate_y: 'Rotate Y',
    rotate_z: 'Rotate Z',
    scale: 'Scale',
    translate: 'Translate',
    constant_volume: 'Constant Volume',
    virtual: 'Virtual',
  };
  const wrapperTypeLabel = typeLabels[wrapperType] ?? wrapperType;
  const wrapperName = getNextUniqueName(geometrics, `${geometricName}_${wrapperTypeLabel}`);

  const newConfig = { ...config };

  // create the wrapper (but don't add it yet — reference update must run first
  // so the wrapper itself doesn't get its own reference rewritten)
  const wrapper = { ...defaultGeometricForType(wrapperType), geometric: geometricName };

  // update all composite/list references: if they point to geometricName,
  // point them to wrapperName instead (so they use the wrapped version)
  Object.values(newConfig.geometrics ?? {}).forEach((geometric) => {
    switch (geometric.type) {
      case 'rotate_x':
      case 'rotate_y':
      case 'rotate_z':
      case 'scale':
      case 'translate':
      case 'constant_volume':
      case 'virtual': {
        if (geometric.geometric === geometricName) {
          geometric.geometric = wrapperName;
        }

        break;
      }
      case 'list': {
        geometric.geometrics = geometric.geometrics.map((name: string) =>
          name === geometricName ? wrapperName : name,
        );

        break;
      }
    }
  });

  // now add the wrapper to geometrics
  newConfig.geometrics = { ...newConfig.geometrics, [wrapperName]: wrapper };

  // update the active scene: replace geometricName with wrapperName
  const activeScene = newConfig.scenes?.[newConfig.active_scene];
  if (activeScene) {
    activeScene.geometrics = activeScene.geometrics.map((name: string) =>
      name === geometricName ? wrapperName : name,
    );
  }

  return { config: newConfig, wrapperName };
}

/**
 * shallow-copy a geometric entry with a new unique name and add it
 * to the active scene.
 */
export function duplicateGeometric(
  config: NormalizedRenderConfig,
  geometricName: string,
): NormalizedRenderConfig {
  const geometrics = config.geometrics;
  if (!geometrics || !(geometricName in geometrics)) {
    return config;
  }

  const newConfig = { ...config };
  const copy = { ...geometrics[geometricName] };
  const newName = getNextUniqueName(geometrics, `${geometricName} (copy)`);
  newConfig.geometrics = { ...newConfig.geometrics, [newName]: copy };

  // add to active scene
  const activeScene = newConfig.scenes?.[newConfig.active_scene];
  if (activeScene) {
    activeScene.geometrics = [...activeScene.geometrics, newName];
  }

  return newConfig;
}

/**
 * add a geometric to a list. if the geometric was directly in the active
 * scene, it is removed from the scene (the list should be in the scene instead).
 */
export function addGeometricToList(
  config: NormalizedRenderConfig,
  geometricName: string,
  listName: string,
): NormalizedRenderConfig {
  const geometrics = config.geometrics;
  if (!geometrics || !(geometricName in geometrics) || !(listName in geometrics)) {
    return config;
  }

  const list = geometrics[listName];
  if (list.type !== 'list') {
    return config;
  }

  // prevent self-reference
  if (geometricName === listName) {
    return config;
  }

  // prevent duplicates
  if (list.geometrics.includes(geometricName)) {
    return config;
  }

  const newConfig = { ...config };

  // add to list
  newConfig.geometrics = {
    ...newConfig.geometrics,
    [listName]: {
      ...list,
      geometrics: [...list.geometrics, geometricName],
    },
  };

  // remove from active scene (only if directly in scene)
  const activeScene = newConfig.scenes?.[newConfig.active_scene];
  if (activeScene?.geometrics.includes(geometricName)) {
    activeScene.geometrics = activeScene.geometrics.filter(
      (name: string) => name !== geometricName,
    );
  }

  return newConfig;
}

/**
 * remove a geometric from a list and re-add it to the active scene.
 */
export function removeGeometricFromList(
  config: NormalizedRenderConfig,
  geometricName: string,
  listName: string,
): NormalizedRenderConfig {
  const geometrics = config.geometrics;
  if (!geometrics || !(listName in geometrics)) {
    return config;
  }

  const list = geometrics[listName];
  if (list.type !== 'list') {
    return config;
  }

  if (!list.geometrics.includes(geometricName)) {
    return config;
  }

  const newConfig = { ...config };

  // remove from list
  newConfig.geometrics = {
    ...newConfig.geometrics,
    [listName]: {
      ...list,
      geometrics: list.geometrics.filter((name: string) => name !== geometricName),
    },
  };

  // re-add to active scene
  const activeScene = newConfig.scenes?.[newConfig.active_scene];
  if (activeScene) {
    activeScene.geometrics = [...activeScene.geometrics, geometricName];
  }

  return newConfig;
}

/**
 * add a geometric to the active scene.
 */
export function addToScene(
  config: NormalizedRenderConfig,
  geometricName: string,
): NormalizedRenderConfig {
  const activeScene = config.scenes?.[config.active_scene];
  if (!activeScene || !config.geometrics?.[geometricName]) {
    return config;
  }

  if (activeScene.geometrics.includes(geometricName)) {
    return config;
  }

  const newConfig = { ...config };
  newConfig.scenes = {
    ...newConfig.scenes,
    [newConfig.active_scene]: {
      ...activeScene,
      geometrics: [...activeScene.geometrics, geometricName],
    },
  };

  return newConfig;
}

/**
 * remove a geometric from the active scene.
 */
export function removeFromScene(
  config: NormalizedRenderConfig,
  geometricName: string,
): NormalizedRenderConfig {
  const activeScene = config.scenes?.[config.active_scene];
  if (!activeScene) {
    return config;
  }

  if (!activeScene.geometrics.includes(geometricName)) {
    return config;
  }

  const newConfig = { ...config };
  newConfig.scenes = {
    ...newConfig.scenes,
    [newConfig.active_scene]: {
      ...activeScene,
      geometrics: activeScene.geometrics.filter((name: string) => name !== geometricName),
    },
  };

  return newConfig;
}
