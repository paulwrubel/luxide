import type {
	RenderConfig,
	RenderConfigSchema
} from '$lib/utils/render/config';
import type {
	GeometricTriangle,
	GeometricParallelogram
} from '$lib/utils/render/geometric';
import type { FormPath, FormPathLeaves, SuperForm } from 'sveltekit-superforms';
import * as THREE from 'three';
import type z from 'zod';

export function createTriangleMesh(
	geometricData: GeometricTriangle
): THREE.Mesh {
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
export function createParallelogramMesh(
	geometricData: GeometricParallelogram
): THREE.Mesh {
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

export function syncronizeRenderConfig(
	superform: SuperForm<z.infer<typeof RenderConfigSchema>>,
	renderConfig: RenderConfig
) {
	return async (form: z.infer<typeof RenderConfigSchema>) => {
		console.log('updating!');

		await updateFields(superform, form, renderConfig);

		console.log('done!');
	};
}

export async function fieldIsValid(
	superform: SuperForm<z.infer<typeof RenderConfigSchema>>,
	path: string
): Promise<boolean> {
	return (
		(await superform.validate(
			path as FormPathLeaves<z.infer<typeof RenderConfigSchema>>
		)) === undefined
	);
}

export async function updateFields(
	superform: SuperForm<z.infer<typeof RenderConfigSchema>>,
	formParent: Record<string, unknown>,
	configParent: Record<string, unknown>,
	parentPath?: string
): Promise<void> {
	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	// console.log('updating fields for:', parentPath);
	for (const path of Object.keys(formParent)) {
		// console.log('   checking:', path);
		const field = formParent[path];
		const configField = configParent[path];
		const fieldPath = parentPath ? `${parentPath}.${path}` : path;
		// if this is an object, it's a nested field
		// so we need to recurse
		if (isRecord(field) && isRecord(configField)) {
			await updateFields(superform, field, configField, fieldPath);
			continue;
		}

		// otherwise, we can check the field directly
		const isValid = await fieldIsValid(
			superform,
			fieldPath as FormPathLeaves<z.infer<typeof RenderConfigSchema>>
		);

		if (isValid) {
			configParent[path] = field;
		}
	}
}

export async function updateFieldIfValid(
	superform: SuperForm<z.infer<typeof RenderConfigSchema>>,
	config: RenderConfig,
	path: FormPath<z.infer<typeof RenderConfigSchema>>,
	newValue: unknown
): Promise<boolean> {
	const isValid = await fieldIsValid(
		superform,
		path as FormPathLeaves<z.infer<typeof RenderConfigSchema>>
	);

	if (isValid) {
		updateField(config, path, newValue);
		return true;
	}

	return false;
}

export function updateField(
	config: RenderConfig,
	path: FormPath<z.infer<typeof RenderConfigSchema>>,
	newValue: unknown
) {
	// parse the path into segments
	const segments = path.split(/\.|\[|\]/).filter(Boolean);

	// start at the root of the config object
	let current: Record<string, unknown> = config;

	// traverse to the second-to-last segment
	for (let i = 0; i < segments.length - 1; i++) {
		if (typeof current !== 'object' && !Array.isArray(current)) {
			console.warn('Invalid config type:', typeof current);
		}
		const segment = segments[i];

		current = current[segment] as Record<string, unknown>;
	}

	// set the value at the final segment
	const lastSegment = segments[segments.length - 1];
	current[lastSegment] = newValue;

	// console.log(`Updated ${path} to:`, newValue);
}
