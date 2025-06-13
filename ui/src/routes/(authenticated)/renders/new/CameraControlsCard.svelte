<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import WarningIconUnaffectedPreview from '$lib/property-icons/WarningIconUnaffectedPreview.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { getContext } from 'svelte';
	import { z } from 'zod';
	import type {
		FormPathArrays,
		FormPathLeaves,
		SuperForm
	} from 'sveltekit-superforms';
	import { type CameraData, getCameraData } from '$lib/utils/render/camera';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import type { RenderConfigContext } from './utils';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		camera: string;
	};

	const { superform, camera }: Props = $props();

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const { data: cameraData, path } = $derived(
		getCameraData(renderConfigContext.get(), camera)
	);
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
	<TextArrayInputControl
		{superform}
		field={`${path}.eye_location` as FormPathArrays<z.infer<typeof schema>>}
		label="Eye"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	<TextArrayInputControl
		{superform}
		field={`${path}.target_location` as FormPathArrays<z.infer<typeof schema>>}
		label="Target"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	<TextArrayInputControl
		{superform}
		field={`${path}.view_up` as FormPathArrays<z.infer<typeof schema>>}
		label="View Up"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	<RangeControl
		{superform}
		field={`${path}.defocus_angle_degrees` as FormPathLeaves<
			z.infer<typeof schema>,
			number
		>}
		label="Defocus Angle (degrees)"
		min={0.0}
		max={180.0}
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
