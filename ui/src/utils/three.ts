import type {
  GeometricTriangle,
  GeometricParallelogram,
  GeometricBilinearPatch,
} from './render/geometric';

export type TriangleGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  uvs: Float32Array;
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

  // uvs: map vertices to barycentric coordinates A=(0,0), B=(1,0), C=(0,1)
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1]);

  return { vertices, indices, normals, uvs };
}

export type ParallelogramGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  uvs: Float32Array;
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

  // uv indices: map the four corners to (0,0), (1,0), (0,1), (1,1)
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

  return { vertices, indices, normals, uvs };
}

export type BilinearPatchGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  uvs: Float32Array;
};

/**
 * returns raw vertex/index/normal data for a bilinear patch,
 * subdivided into a 16x16 grid with normals from partial derivatives.
 */
export function createBilinearPatchGeometry(
  geometricData: GeometricBilinearPatch,
): BilinearPatchGeometry {
  const { p00, p10, p01, p11 } = geometricData;

  const divs = 16;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const evalPatch = (u: number, v: number): [number, number, number] => {
    const w00 = (1 - u) * (1 - v);
    const w10 = u * (1 - v);
    const w01 = (1 - u) * v;
    const w11 = u * v;
    return [
      w00 * p00[0] + w10 * p10[0] + w01 * p01[0] + w11 * p11[0],
      w00 * p00[1] + w10 * p10[1] + w01 * p01[1] + w11 * p11[1],
      w00 * p00[2] + w10 * p10[2] + w01 * p01[2] + w11 * p11[2],
    ];
  };

  // generate vertices and normals (divs+1 x divs+1 grid)
  for (let j = 0; j <= divs; j++) {
    const v = j / divs;
    for (let i = 0; i <= divs; i++) {
      const u = i / divs;
      const p = evalPatch(u, v);
      positions.push(...p);

      // compute normal from partial derivatives
      const eps = 0.001;
      const du_u = Math.min(u + eps, 1.0 + eps);
      const dv_v = Math.min(v + eps, 1.0 + eps);
      const du = evalPatch(du_u, v);
      const dv = evalPatch(u, dv_v);

      const dp_du = [du[0] - p[0], du[1] - p[1], du[2] - p[2]];
      const dp_dv = [dv[0] - p[0], dv[1] - p[1], dv[2] - p[2]];

      // cross product dp_du x dp_dv
      const nx = dp_du[1] * dp_dv[2] - dp_du[2] * dp_dv[1];
      const ny = dp_du[2] * dp_dv[0] - dp_du[0] * dp_dv[2];
      const nz = dp_du[0] * dp_dv[1] - dp_du[1] * dp_dv[0];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / len, ny / len, nz / len);
      uvs.push(u, v);
    }
  }

  // generate triangle indices (two per grid cell)
  for (let j = 0; j < divs; j++) {
    for (let i = 0; i < divs; i++) {
      const a = j * (divs + 1) + i;
      const b = a + 1;
      const c = a + (divs + 1);
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  return {
    vertices: new Float32Array(positions),
    indices: new Uint16Array(indices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
  };
}
