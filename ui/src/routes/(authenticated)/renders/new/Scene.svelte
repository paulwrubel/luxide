<script lang="ts">
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';
	import * as THREE from 'three';
	import {
		createParallelogramMesh,
		createTriangleMesh,
		type RenderConfigContext
	} from './utils';
	import { getCameraData } from '$lib/utils/render/camera';
	import {
		getGeometricDataSafe,
		isComposite
	} from '$lib/utils/render/geometric';
	import {
		getMaterialDataSafe,
		type MaterialData
	} from '$lib/utils/render/material';
	import { getSceneData } from '$lib/utils/render/scene';
	import { getTextureDataSafe } from '$lib/utils/render/texture';
	import { toRadians } from '$lib/utils/render/utils';
	import { getCenterPoint } from '$lib/utils/render/geometric';

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const activeScene = $derived(
		getSceneData(
			renderConfigContext.get(),
			renderConfigContext.get().active_scene
		)
	);
	const { data: camera } = $derived(
		getCameraData(renderConfigContext.get(), activeScene.camera)
	);

	const threeCam = $derived.by<THREE.PerspectiveCamera>(() => {
		const cam = new THREE.PerspectiveCamera();

		cam.fov = camera.vertical_field_of_view_degrees;

		const [posX, posY, posZ] = camera.eye_location;
		cam.position.set(posX, posY, posZ);

		const [upX, upY, upZ] = camera.view_up;
		cam.up.set(upX, upY, upZ);

		const [targetX, targetY, targetZ] = camera.target_location;
		cam.lookAt(targetX, targetY, targetZ);

		return cam;
	});

	function getGeometricMeshesAndLights(
		geometricName: string
	): (THREE.Mesh | THREE.Light)[] {
		const { data } = getGeometricDataSafe(
			renderConfigContext.get(),
			geometricName
		);

		const meshes: (THREE.Mesh | THREE.Light)[] = [];

		switch (data.type) {
			case 'box': {
				const mesh = new THREE.Mesh();

				const width = Math.abs(data.a[0] - data.b[0]);
				const height = Math.abs(data.a[1] - data.b[1]);
				const depth = Math.abs(data.a[2] - data.b[2]);

				const position = [
					(data.a[0] + data.b[0]) / 2,
					(data.a[1] + data.b[1]) / 2,
					(data.a[2] + data.b[2]) / 2
				];

				mesh.geometry = new THREE.BoxGeometry(width, height, depth);
				const materials = getMaterials(data.material);
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
					...data.geometrics.flatMap((subName) =>
						getGeometricMeshesAndLights(subName)
					)
				);
				break;
			}
			case 'obj_model': {
				console.warn('.obj model not yet supported');
				break;
			}
			case 'rotate_x': {
				const subMeshes = getGeometricMeshesAndLights(data.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.x += toRadians(data);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'rotate_y': {
				const subMeshes = getGeometricMeshesAndLights(data.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.y += toRadians(data);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'rotate_z': {
				const subMeshes = getGeometricMeshesAndLights(data.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.rotation.z += toRadians(data);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'translate': {
				const subMeshes = getGeometricMeshesAndLights(data.geometric);

				subMeshes.forEach((subMesh) => {
					subMesh.position.set(
						subMesh.position.x + data.translation[0],
						subMesh.position.y + data.translation[1],
						subMesh.position.z + data.translation[2]
					);
				});

				meshes.push(...subMeshes);
				break;
			}
			case 'parallelogram': {
				const mesh = createParallelogramMesh(data);

				const materials = getMaterials(data.material);
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

				mesh.geometry = new THREE.SphereGeometry(data.radius);
				const materials = getMaterials(data.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				meshes.push(mesh);
				break;
			}
			case 'triangle': {
				const mesh = createTriangleMesh(data);

				const materials = getMaterials(data.material);
				if (materials.length === 1) {
					mesh.material = materials[0];
				} else if (materials.length > 1) {
					mesh.material = materials;
				}

				meshes.push(mesh);
				break;
			}
			case 'constant_volume': {
				console.warn('Constant volume not yet supported');
				break;
			}
		}

		const lightSources = getLightSources(geometricName);
		if (lightSources.length > 0) {
			meshes.push(...lightSources);
		}

		meshes.forEach((mesh) => {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		});

		return meshes;
	}

	function getLightSources(geometricName: string): THREE.Light[] {
		const { data: geometricData } = getGeometricDataSafe(
			renderConfigContext.get(),
			geometricName
		);

		const lightSources: THREE.Light[] = [];
		if (
			!isComposite(geometricData) &&
			geometricData.type !== 'constant_volume'
		) {
			const { data: materialData } = getMaterialDataSafe(
				renderConfigContext.get(),
				geometricData.material
			);
			const { data: emittanceTextureData } = getTextureDataSafe(
				renderConfigContext.get(),
				materialData.emittance_texture
			);
			const emissiveColor =
				emittanceTextureData.type === 'color' &&
				emittanceTextureData.color.reduce((a, b) => a + b, 0) > 0
					? emittanceTextureData.color
					: undefined;

			if (emissiveColor !== undefined) {
				const pointLight = new THREE.PointLight();

				const [centerX, centerY, centerZ] = getCenterPoint(
					renderConfigContext.get(),
					geometricData
				);
				pointLight.position.set(centerX, centerY, centerZ);
				pointLight.intensity = emissiveColor.reduce((a, b) => a + b, 0) / 3;
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
		const { data: materialData } = getMaterialDataSafe(
			renderConfigContext.get(),
			data
		);

		const { data: reflectanceTextureData } = getTextureDataSafe(
			renderConfigContext.get(),
			materialData.reflectance_texture
		);
		const { data: emittanceTextureData } = getTextureDataSafe(
			renderConfigContext.get(),
			materialData.emittance_texture
		);
		const emissiveColor =
			emittanceTextureData.type === 'color' &&
			emittanceTextureData.color.reduce((a, b) => a + b, 0) > 0
				? emittanceTextureData.color
				: undefined;
		const emissive = emissiveColor
			? new THREE.Color(...emissiveColor)
			: undefined;

		const materials: THREE.Material[] = [];

		switch (materialData.type) {
			case 'dielectric': {
				console.warn('Dielectric material not yet supported');
				break;
			}
			case 'lambertian': {
				switch (reflectanceTextureData.type) {
					case 'checker': {
						console.warn(
							'Checker texture not yet supported for lambertian material'
						);
						break;
					}
					case 'image': {
						console.warn(
							'Image texture not yet supported for lambertian material'
						);
						break;
					}
					case 'color': {
						const material = new THREE.MeshLambertMaterial({
							color: new THREE.Color(...reflectanceTextureData.color)
						});

						if (emissive) {
							material.emissive = emissive;
							material.shadowSide = THREE.FrontSide;
						}

						materials.push(material);
						break;
					}
				}
				break;
			}
			case 'specular': {
				switch (reflectanceTextureData.type) {
					case 'checker': {
						console.warn(
							'Checker texture not yet supported for specular material'
						);
						break;
					}
					case 'image': {
						console.warn(
							'Image texture not yet supported for specular material'
						);
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

{#each activeScene.geometrics as geometric (geometric)}
	{#each getGeometricMeshesAndLights(geometric) as meshOrLight (meshOrLight)}
		<T is={meshOrLight} />
	{/each}
{/each}
