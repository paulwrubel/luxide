import type { GeometricParallelogram } from '$lib/render.svelte';
import * as THREE from 'three';

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

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	// create and return mesh
	return mesh;
}
