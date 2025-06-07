<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import WarningIconUnaffectedPreview from '$lib/property-icons/WarningIconUnaffectedPreview.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import {
		RenderConfigSchema,
		type RenderConfig
	} from '$lib/utils/render/config';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { getContext } from 'svelte';
	import { z } from 'zod';
	import type { FormPathLeaves, SuperForm } from 'sveltekit-superforms';
	import { type CameraData, getCameraData } from '$lib/utils/render/camera';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		camera: string | CameraData;
	};

	const { superform, camera }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data: cameraData, path } = $derived(
		getCameraData(renderConfig, camera)
	);

	$inspect(renderConfig.active_scene);
</script>

{#snippet controlsCamera(data: CameraData)}
	<RangeControl
		{superform}
		field={`${path}.vertical_field_of_view_degrees` as FormPathLeaves<
			z.infer<typeof schema>,
			number
		>}
		label="Vertical FOV (degrees)"
		min={10.0}
		max={170.0}
		step={1.0}
	/>
	<!-- <VectorInputControl
		label="Eye"
		bind:value={data.eye_location}
		valueLabel={['x', 'y', 'z']}
	/>
	<VectorInputControl
		label="Target"
		bind:value={data.target_location}
		valueLabel={['x', 'y', 'z']}
	/>
	<VectorInputControl
		label="View Up"
		bind:value={data.view_up}
		valueLabel={['x', 'y', 'z']}
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
	</RangeControl> -->
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
