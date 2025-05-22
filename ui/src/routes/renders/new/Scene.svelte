<script lang="ts">
	import {
		type GeometricData,
		type MaterialData,
		type RenderConfig,
		getCameraData,
		getDefaultRenderConfig,
		getGeometricData,
		getMaterialData,
		getSceneData,
		getTextureData,
		isComposite,
		toRadians
	} from '$lib/render';
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';
	import * as THREE from 'three';
	import { createParallelogramMesh } from './utils';
	import { emissive } from 'three/tsl';
	import { PointLight } from 'three';

	const config = getContext<RenderConfig>('renderConfig');

	const activeScene = $derived(getSceneData(config, config.active_scene));
	const camera = $derived(getCameraData(config, activeScene.camera));

	const threeCam = $derived.by<THREE.PerspectiveCamera>(() => {
		const cam = new THREE.PerspectiveCamera();

		cam.fov = camera.vertical_field_of_view_degrees;

		const [posX, posY, posZ] = camera.eye_location;
		cam.position.set(posX, posY, posZ);

		const [targetX, targetY, targetZ] = camera.target_location;
		cam.lookAt(targetX, targetY, targetZ);

		return cam;
	});

	$inspect(threeCam);
</script>

{#snippet geometry(data: string | GeometricData)}
	{@const standardProps = { castShadow: true, receiveShadow: true }}

	{@const geometricData = getGeometricData(config, data)}
	{#if geometricData.type === 'box'}
		<!-- box implementation -->
		<T.Mesh {...standardProps}>
			<T.BoxGeometry args={[geometricData.a[0], geometricData.a[1], geometricData.a[2]]} />
		</T.Mesh>
	{:else if geometricData.type === 'list'}
		<!-- list implementation -->
		{#each geometricData.geometrics as geometric}
			{@render geometry(geometric)}
		{/each}
	{:else if geometricData.type === 'obj_model'}
		<!-- obj_model implementation -->
	{:else if geometricData.type === 'rotate_x'}
		<!-- rotate_x implementation -->
		<T.Mesh {...standardProps} rotation={[toRadians(geometricData), 0, 0]}>
			{@render geometry(geometricData.geometric)}
		</T.Mesh>
	{:else if geometricData.type === 'rotate_y'}
		<!-- rotate_y implementation -->
		<T.Mesh {...standardProps} rotation={[0, toRadians(geometricData), 0]}>
			{@render geometry(geometricData.geometric)}
		</T.Mesh>
	{:else if geometricData.type === 'rotate_z'}
		<!-- rotate_z implementation -->
		<T.Mesh {...standardProps} rotation={[0, 0, toRadians(geometricData)]}>
			{@render geometry(geometricData.geometric)}
		</T.Mesh>
	{:else if geometricData.type === 'translate'}
		<!-- translate implementation -->
	{:else if geometricData.type === 'parallelogram'}
		<!-- parallelogram implementation -->
		<T is={createParallelogramMesh(geometricData)} {...standardProps}>
			{@render material(geometricData.material)}
		</T>
	{:else if geometricData.type === 'sphere'}
		<!-- sphere implementation -->
		<T.Mesh {...standardProps}>
			<T.SphereGeometry args={[geometricData.radius]} />
			{@render material(geometricData.material)}
		</T.Mesh>
	{:else if geometricData.type === 'triangle'}
		<!-- triangle implementation -->
	{:else if geometricData.type === 'constant_volume'}
		<!-- constant_volume implementation -->
	{/if}

	{@render lightSource(data)}
{/snippet}

{#snippet material(data: string | MaterialData)}
	{@const materialData = getMaterialData(config, data)}

	{@const reflectanceTextureData = getTextureData(config, materialData.reflectance_texture)}
	{@const emittanceTextureData = getTextureData(config, materialData.emittance_texture)}
	{@const emissiveColor =
		emittanceTextureData.type === 'color' ? emittanceTextureData.color : undefined}

	{#if materialData.type === 'dielectric'}
		<!-- dielectric implementation -->
	{:else if materialData.type === 'lambertian'}
		<!-- lambertian implementation -->
		{#if reflectanceTextureData.type === 'color'}
			<T.MeshStandardMaterial color={reflectanceTextureData.color} emissive={emissiveColor} />
		{/if}
	{:else if materialData.type === 'specular'}
		<!-- specular implementation -->
	{/if}
{/snippet}

{#snippet lightSource(geometric: string | GeometricData)}
	{@const geometricData = getGeometricData(config, geometric)}
	<!-- {@debug geometricData} -->
	{#if !isComposite(geometricData) && geometricData.type !== 'constant_volume'}
		<!-- {@debug geometricData} -->
		{@const materialData = getMaterialData(config, geometricData.material)}
		{@const emittanceTextureData = getTextureData(config, materialData.emittance_texture)}
		{@const emissiveColor =
			emittanceTextureData.type === 'color' ? emittanceTextureData.color : undefined}

		{#if emissiveColor !== undefined}
			<T.PointLight
				position={[0.5, 0.99, -0.5]}
				intensity={0.1}
				color={(() => {
					console.log('point lighting: ', emissiveColor);
					return emissiveColor;
				})()}
				castShadow
				receiveShadow
			/>
		{/if}
	{/if}
{/snippet}

<T is={threeCam} makeDefault />

{#each activeScene.geometrics as geometric}
	{@render geometry(geometric)}
{/each}

<!-- <T.AmbientLight /> -->

<!-- <T.Mesh position={[0.1, 0.1, -0.1]}>
	<T.SphereGeometry args={[0.05]} />
	<T.MeshLambertMaterial color="green" emissive="white" />
</T.Mesh> -->

<!-- <T.PointLight position={[0.1, 0.1, -0.1]} castShadow receiveShadow /> -->

<!-- sphere -->
<!-- <T.Mesh position={[0.5, 0.5, -0.5]} castShadow receiveShadow>
	<T.SphereGeometry args={[0.25]} />
	<T.MeshStandardMaterial color="green" />
</T.Mesh> -->

<!-- left wall -->
<!-- <T.Mesh position={[0, 0.5, -0.5]} rotation={[0, toRadians(90), 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="red" />
</T.Mesh> -->

<!-- right wall -->
<!-- <T.Mesh position={[1, 0.5, -0.5]} rotation={[0, toRadians(-90), 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="blue" />
</T.Mesh> -->

<!-- floor -->
<!-- <T.Mesh position={[0.5, 0, -0.5]} rotation={[toRadians(-90), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="green" />
</T.Mesh> -->

<!-- ceiling -->
<!-- <T.Mesh position={[0.5, 1, -0.5]} rotation={[toRadians(90), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="purple" />
</T.Mesh> -->

<!-- back wall -->
<!-- <T.Mesh position={[0.5, 0.5, -1.0]} rotation={[0, 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->

<!-- front wall -->
<!-- <T.Mesh position={[0.5, 0.5, 0]} rotation={[toRadians(180), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh> -->
