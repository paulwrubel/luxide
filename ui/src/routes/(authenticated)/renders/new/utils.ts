import type {
	GeometricParallelogram,
	GeometricTriangle,
	RenderConfig,
	RenderConfigSchema
} from '$lib/utils/render/config';
import type { FormPathLeaves, SuperForm } from 'sveltekit-superforms';
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
		// function to simplify checking a field error
		async function isValid(path: string): Promise<boolean> {
			return (
				(await superform.validate(
					path as FormPathLeaves<z.infer<typeof RenderConfigSchema>>
				)) === undefined
			);
		}

		const { valid } = await superform.validateForm();
		if (valid) {
			// whole form is valid, so we can just
			// copy everything and be done with it
			renderConfig.parameters = form.parameters;
		}

		function isRecord(value: unknown): value is Record<string, unknown> {
			return typeof value === 'object' && value !== null;
		}

		async function updateFields(
			formParent: Record<string, unknown>,
			configParent: Record<string, unknown>,
			parentPath?: string
		): Promise<void> {
			const rootIsValid = parentPath
				? await isValid(parentPath)
				: (await superform.validateForm()).valid;

			if (rootIsValid) {
				configParent = formParent;
				return;
			}

			for (const path of Object.keys(formParent)) {
				const field = formParent[path];
				const configField = configParent[path];
				const fieldPath = parentPath ? `${parentPath}.${path}` : path;
				// if this is an object, it's a nested field
				// so we need to recurse
				if (isRecord(field) && isRecord(configField)) {
					await updateFields(field, configField, fieldPath);
					continue;
				}

				// otherwise, we can check the field directly
				const fieldIsValid = await isValid(
					fieldPath as FormPathLeaves<z.infer<typeof RenderConfigSchema>>
				);
				if (fieldIsValid) {
					configParent[path] = field;
				} else {
					console.log('error! not setting', fieldPath, 'to', field);
				}
			}
		}

		await updateFields(form, renderConfig);
	};
}
