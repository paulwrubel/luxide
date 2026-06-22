import type { GeometricTriangle, GeometricParallelogram } from './render/geometric';

export type TriangleGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
};

/**
 * returns raw vertex/index/normal data for a triangle.
 * Computes the face normal if per-vertex normals are not provided.
 */
export function createTriangleGeometry(geometricData: GeometricTriangle): TriangleGeometry {
  const { a, b, c, a_normal, b_normal, c_normal } = geometricData;

  const vertices = new Float32Array([a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]]);

  const indices = new Uint16Array([0, 1, 2]);

  let normals: Float32Array;
  if (a_normal && b_normal && c_normal) {
    normals = new Float32Array([
      a_normal[0],
      a_normal[1],
      a_normal[2],
      b_normal[0],
      b_normal[1],
      b_normal[2],
      c_normal[0],
      c_normal[1],
      c_normal[2],
    ]);
  } else {
    // compute face normal: (b - a) × (c - a), normalized
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const abz = b[2] - a[2];
    const acx = c[0] - a[0];
    const acy = c[1] - a[1];
    const acz = c[2] - a[2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    normals = new Float32Array([
      nx / len,
      ny / len,
      nz / len,
      nx / len,
      ny / len,
      nz / len,
      nx / len,
      ny / len,
      nz / len,
    ]);
  }

  return { vertices, indices, normals };
}

export type ParallelogramGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
};

/**
 * returns raw vertex/index/normal data for a parallelogram (quad).
 * Normal is cross(u, v) normalized, same for all four vertices.
 */
export function createParallelogramGeometry(
  geometricData: GeometricParallelogram,
): ParallelogramGeometry {
  const { lower_left, u, v } = geometricData;
  const ll = lower_left;

  const vertices = new Float32Array([
    ll[0],
    ll[1],
    ll[2],
    ll[0] + u[0],
    ll[1] + u[1],
    ll[2] + u[2],
    ll[0] + v[0],
    ll[1] + v[1],
    ll[2] + v[2],
    ll[0] + u[0] + v[0],
    ll[1] + u[1] + v[1],
    ll[2] + u[2] + v[2],
  ]);

  const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);

  // normal = cross(u, v) normalized
  const nx = u[1] * v[2] - u[2] * v[1];
  const ny = u[2] * v[0] - u[0] * v[2];
  const nz = u[0] * v[1] - u[1] * v[0];
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const normals = new Float32Array([
    nx / len,
    ny / len,
    nz / len,
    nx / len,
    ny / len,
    nz / len,
    nx / len,
    ny / len,
    nz / len,
    nx / len,
    ny / len,
    nz / len,
  ]);

  return { vertices, indices, normals };
}
