import * as THREE from 'three';
import type { GeometricTriangle, GeometricParallelogram } from './render/geometric';

/**
 * Creates a mesh representing a triangle with custom vertices.
 * Automatically computes normals if custom vertex normals are not provided.
 */
export function createTriangleMesh(geometricData: GeometricTriangle): THREE.Mesh {
  const { a, b, c, a_normal, b_normal, c_normal } = geometricData;

  const geometry = new THREE.BufferGeometry();

  // calculate the three corners
  const vertices = new Float32Array([
    a[0],
    a[1],
    a[2], // vertex a
    b[0],
    b[1],
    b[2], // vertex b
    c[0],
    c[1],
    c[2], // vertex c
  ]);

  const hasCustomNormals = !!(a_normal && b_normal && c_normal);

  // create faces (one triangle)
  const indices = [0, 1, 2];

  // set geometry attributes
  if (hasCustomNormals) {
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(
        new Float32Array([
          a_normal[0],
          a_normal[1],
          a_normal[2],
          b_normal[0],
          b_normal[1],
          b_normal[2],
          c_normal[0],
          c_normal[1],
          c_normal[2],
        ]),
        3,
      ),
    );
  } else {
    geometry.computeVertexNormals();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  return new THREE.Mesh(geometry);
}

/**
 * Creates a mesh representing a parallelogram based on lower_left corner
 * and u, v vectors. More direct than transforming a PlaneGeometry.
 */
export function createParallelogramMesh(geometricData: GeometricParallelogram): THREE.Mesh {
  const { lower_left, u, v } = geometricData;

  const geometry = new THREE.BufferGeometry();

  // calculate the four corners
  const ll = lower_left;
  const vertices = new Float32Array([
    ll[0],
    ll[1],
    ll[2], // lower left
    ll[0] + u[0],
    ll[1] + u[1],
    ll[2] + u[2], // lower right
    ll[0] + v[0],
    ll[1] + v[1],
    ll[2] + v[2], // upper left
    ll[0] + u[0] + v[0],
    ll[1] + u[1] + v[1],
    ll[2] + u[2] + v[2], // upper right
  ]);

  // create faces (two triangles)
  const indices = [
    0,
    1,
    2, // first triangle
    1,
    3,
    2, // second triangle
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry);
}
