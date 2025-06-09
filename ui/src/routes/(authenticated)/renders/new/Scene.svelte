<script lang="ts">
	import { type RenderConfig } from '$lib/utils/render/config';
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';
	import * as THREE from 'three';
	import { createParallelogramMesh, createTriangleMesh } from './utils';
	import { getCameraData } from '$lib/utils/render/camera';
	import {
		type GeometricData,
		getGeometricData,
		isComposite
	} from '$lib/utils/render/geometric';
	import {
		getMaterialData,
		type MaterialData
	} from '$lib/utils/render/material';
	import { getSceneData } from '$lib/utils/render/scene';
	import { getTextureData } from '$lib/utils/render/texture';
	import { toRadians } from '$lib/utils/render/utils';

	const config = getContext<RenderConfig>('renderConfig');

	const activeScene = $derived(getSceneData(config, config.active_scene));
	const { data: camera } = $derived(getCameraData(config, activeScene.camera));

	const threeCam = $derived.by<THREE.PerspectiveCamera>(() => {
		const cam = new THREE.PerspectiveCamera();

		cam.fov = camera.vertical_field_of_view_degrees;

		const [posX, posY, posZ] = camera.eye_location;
		cam.position.set(posX, posY, posZ);

		const [upX, upY, upZ] = camera.view_up;
		cam.up.set(upX, upY, upZ);

		const [targetX, targetY, targetZ] = camera.target_location;
		cam.lookAt(targetX, targetY, targetZ);

		// cam.focus = camera.focus_distance;

		return cam;
	});

	function getGeometricMeshesAndLights(
		data: string | GeometricData
	): (THREE.Mesh | THREE.Light)[] {
		const { data: geometricData } = getGeometricData(config, data);

		const meshes: (THREE.Mesh | THREE.Light)[] = [];

		switch (geometricData.type) {
			case 'box': {
				const mesh = new THREE.Mesh();

				const width = Math.abs(geometricData.a[0] - geometricData.b[0]);
				const height = Math.abs(geometricData.a[1] - geometricData.b[1]);
				const depth = Math.abs(geometricData.a[2] - geometricData.b[2]);

				const position = [
					(geometricData.a[0] + geometricData.b[0]) / 2,
					(geometricData.a[1] + geometricData.b[1]) / 2,
					(geometricData.a[2] + geometricData.b[2]) / 2
				];

				mesh.geometry = new THREE.BoxGeometry(width, height, depth);
				const materials = getMaterials(geometricData.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				mesh.position.set(position[0], position[1], position[2]);

				meshes.push(mesh);
				break;
			}
			case 'list': {
				meshes.push(
					...geometricData.geometrics
						.map((elementData) =>
							getGeometricMeshesAndLights(
								getGeometricData(config, elementData).data
							)
						)
						.flat()
				);
				break;
			}
			case 'obj_model': {
				break;
			}
			case 'rotate_x': {
				const subMeshes = getGeometricMeshesAndLights(geometricData.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.x += toRadians(geometricData);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'rotate_y': {
				const subMeshes = getGeometricMeshesAndLights(geometricData.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.y += toRadians(geometricData);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'rotate_z': {
				const subMeshes = getGeometricMeshesAndLights(geometricData.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.z += toRadians(geometricData);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'translate': {
				const subMeshes = getGeometricMeshesAndLights(geometricData.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.position.set(
						subMesh.position.x + geometricData.translation[0],
						subMesh.position.y + geometricData.translation[1],
						subMesh.position.z + geometricData.translation[2]
					);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'parallelogram': {
				const mesh = createParallelogramMesh(geometricData);

				const materials = getMaterials(geometricData.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				meshes.push(mesh);
				break;
			}
			case 'sphere': {
				const mesh = new THREE.Mesh();

				mesh.geometry = new THREE.SphereGeometry(geometricData.radius);
				const materials = getMaterials(geometricData.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				meshes.push(mesh);
				break;
			}
			case 'triangle': {
				const mesh = createTriangleMesh(geometricData);

				const materials = getMaterials(geometricData.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				meshes.push(mesh);
				break;
			}
			case 'constant_volume': {
				break;
			}
		}

		meshes.push(...getLightSources(data));

		meshes.forEach((mesh) => {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		});

		return meshes;
	}

	function getLightSources(geometric: string | GeometricData): THREE.Light[] {
		const { data: geometricData } = getGeometricData(config, geometric);

		const lightSources: THREE.Light[] = [];
		if (
			!isComposite(geometricData) &&
			geometricData.type !== 'constant_volume'
		) {
			const materialData = getMaterialData(config, geometricData.material);
			const emittanceTextureData = getTextureData(
				config,
				materialData.emittance_texture
			);
			const emissiveColor =
				emittanceTextureData.type === 'color'
					? emittanceTextureData.color
					: undefined;

			if (emissiveColor !== undefined) {
				const pointLight = new THREE.PointLight();

				pointLight.position.set(0.5, 0.99, -0.5);
				pointLight.intensity = 0.1;
				pointLight.color = new THREE.Color(...emissiveColor);

				lightSources.push(pointLight);
			}
		}

		lightSources.forEach((light) => {
			light.castShadow = true;
			light.receiveShadow = true;
		});

		return lightSources;
	}

	function getMaterials(data: string | MaterialData): THREE.Material[] {
		const materialData = getMaterialData(config, data);

		const reflectanceTextureData = getTextureData(
			config,
			materialData.reflectance_texture
		);
		const emittanceTextureData = getTextureData(
			config,
			materialData.emittance_texture
		);
		const emissiveColor =
			emittanceTextureData.type === 'color'
				? emittanceTextureData.color
				: undefined;

		const materials: THREE.Material[] = [];

		switch (materialData.type) {
			case 'dielectric': {
				break;
			}
			case 'lambertian': {
				switch (reflectanceTextureData.type) {
					case 'checker': {
						break;
					}
					case 'image': {
						break;
					}
					case 'color': {
						const material = new THREE.MeshLambertMaterial({
							color: new THREE.Color(...reflectanceTextureData.color),
							emissive: emissiveColor
								? new THREE.Color(...emissiveColor)
								: undefined
						});

						materials.push(material);
						break;
					}
				}
				break;
			}
			case 'specular': {
				switch (reflectanceTextureData.type) {
					case 'checker': {
						break;
					}
					case 'image': {
						break;
					}
					case 'color': {
						const material = new THREE.MeshStandardMaterial({
							color: new THREE.Color(...reflectanceTextureData.color),
							emissive: emissiveColor
								? new THREE.Color(...emissiveColor)
								: undefined,

							metalness: 1.0,
							roughness: materialData.roughness
						});

						materials.push(material);
						break;
					}
				}
			}
		}

		return materials;
	}
</script>

<T is={threeCam} makeDefault />
<T.AmbientLight intensity={0.05} />

{#each activeScene.geometrics as geometric}
	{#each getGeometricMeshesAndLights(geometric) as meshOrLight}
		<T is={meshOrLight} />
	{/each}
{/each}
