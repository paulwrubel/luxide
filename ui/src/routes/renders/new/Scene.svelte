<script lang="ts">
	import { T } from '@threlte/core';
</script>

<T.PerspectiveCamera
	makeDefault
	fov={40}
	position={[0.5, 0.5, 1.44144]}
	oncreate={(camera) => {
		camera.lookAt(0.5, 0.5, 0);
	}}
/>

<!-- subject sphere -->
<T.Mesh position={[0.5, 0.5, -0.5]}>
	<T.SphereGeometry args={[0.1]} />
	<T.MeshBasicMaterial color="green" />
</T.Mesh>

<T.Mesh position={[0, 0.5, -0.5]} rotation={[88, 0, 0]}>
	<T.PlaneGeometry args={[1, 1]} />
	<T.MeshBasicMaterial color="red" />
</T.Mesh>
