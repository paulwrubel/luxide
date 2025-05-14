<script lang="ts">
	import { toRadians } from '$lib/math';
	import type { RenderConfig } from '$lib/render.svelte';
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';

	const config = getContext<RenderConfig>('render');
</script>

<T.PerspectiveCamera
	makeDefault
	fov={40.0}
	position={[0.5, 0.5, 1.44144]}
	oncreate={(camera) => {
		camera.lookAt(0.5, 0.5, 0);
	}}
/>

<T.Mesh position={[0.1, 0.1, -0.1]}>
	<T.SphereGeometry args={[0.05]} />
	<T.MeshLambertMaterial color="green" emissive="white" />
</T.Mesh>
<T.PointLight position={[0.1, 0.1, -0.1]} castShadow receiveShadow />

<!-- sphere -->
<T.Mesh position={[0.5, 0.5, -0.5]} castShadow receiveShadow>
	<T.SphereGeometry args={[0.25]} />
	<T.MeshStandardMaterial color="green" />
</T.Mesh>

<!-- left wall -->
<T.Mesh position={[0, 0.5, -0.5]} rotation={[0, toRadians(90), 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="red" />
</T.Mesh>

<!-- right wall -->
<T.Mesh position={[1, 0.5, -0.5]} rotation={[0, toRadians(-90), 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="blue" />
</T.Mesh>

<!-- floor -->
<T.Mesh position={[0.5, 0, -0.5]} rotation={[toRadians(-90), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="green" />
</T.Mesh>

<!-- ceiling -->
<T.Mesh position={[0.5, 1, -0.5]} rotation={[toRadians(90), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="purple" />
</T.Mesh>

<!-- back wall -->
<T.Mesh position={[0.5, 0.5, -1.0]} rotation={[0, 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh>

<!-- front wall -->
<T.Mesh position={[0.5, 0.5, 0]} rotation={[toRadians(180), 0, 0]} castShadow receiveShadow>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshStandardMaterial color="white" />
</T.Mesh>
