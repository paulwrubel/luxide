import type { GeometricParallelogram, GeometricTriangle } from '$lib/render';
import * as THREE from 'three';

export function createTriangleMesh(geometricData: GeometricTriangle): THREE.Mesh {
	const { a, b, c, a_normal, b_normal, c_normal } = geometricData;

	// create a custom geometry with vertices directly
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
		c[2] // vertex c
	]);

	const hasCustomNormals = a_normal && b_normal && c_normal;

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
					c_normal[2]
				]),
				3
			)
		);
	} else {
		geometry.computeVertexNormals();
	}

	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	geometry.setIndex(indices);

	const mesh = new THREE.Mesh(geometry);

	// create and return mesh
	return mesh;
}

// creates a mesh representing a parallelogram based on lower left corner and u,v vectors
// this is more direct than transforming a PlaneGeometry
export function createParallelogramMesh(geometricData: GeometricParallelogram): THREE.Mesh {
	const { lower_left, u, v } = geometricData;

	// create a custom geometry with vertices directly
	const geometry = new THREE.BufferGeometry();

	// calculate the four corners
	const vertices = new Float32Array([
		lower_left[0],
		lower_left[1],
		lower_left[2], // lower left
		lower_left[0] + u[0],
		lower_left[1] + u[1],
		lower_left[2] + u[2], // lower right
		lower_left[0] + v[0],
		lower_left[1] + v[1],
		lower_left[2] + v[2], // upper left
		lower_left[0] + u[0] + v[0],
		lower_left[1] + u[1] + v[1],
		lower_left[2] + u[2] + v[2] // upper right
	]);

	// create faces (two triangles)
	const indices = [
		0,
		1,
		2, // first triangle
		1,
		3,
		2 // second triangle
	];

	// set geometry attributes
	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();

	const mesh = new THREE.Mesh(geometry);

	// create and return mesh
	return mesh;
}
