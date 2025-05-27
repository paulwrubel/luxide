<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import WarningIconUnaffectedPreview from '$lib/property-icons/WarningIconUnaffectedPreview.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import {
		getCameraData,
		type CameraData,
		type RenderConfig
	} from '$lib/utils/render';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { getContext } from 'svelte';

	type Props = {
		camera: string | CameraData;
	};

	const { camera }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const cameraData = getCameraData(renderConfig, camera);
</script>

{#snippet controlsCamera(data: CameraData)}
	<RangeControl
		label="Vertical FOV (degrees)"
		bind:value={data.vertical_field_of_view_degrees}
		min={10.0}
		max={170.0}
		step={1.0}
	/>
	<VectorInputControl
		label="Eye"
		bind:value={data.eye_location}
		valueLabel={['X', 'Y', 'Z']}
	/>
	<VectorInputControl
		label="Target"
		bind:value={data.target_location}
		valueLabel={['X', 'Y', 'Z']}
	/>
	<VectorInputControl
		label="View Up"
		bind:value={data.view_up}
		valueLabel={['X', 'Y', 'Z']}
	/>
	<RangeControl
		label="Defocus Angle (degrees)"
		bind:value={data.defocus_angle_degrees}
		min={0.0}
		step={1.0}
	>
		{#snippet labelPrefix()}
			<WarningIconUnaffectedPreview />
		{/snippet}
	</RangeControl>
	<!-- <RangeControl label="Focus Distance" bind:value={data.focus_distance} /> -->
{/snippet}

<ControlsCard
	startExpanded
	leftLabel={typeof camera === 'string' ? camera : 'inline'}
	leftLabelStyle={typeof camera === 'string' ? 'bold' : 'light'}
>
	<div class="flex flex-col gap-2 p-4">
		<!-- controls -->
		{@render controlsCamera(cameraData)}
	</div>
</ControlsCard>
