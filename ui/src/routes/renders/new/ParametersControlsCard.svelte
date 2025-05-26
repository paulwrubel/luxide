<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import {
		getCameraData,
		type CameraData,
		type RenderConfig,
		type RenderParameters
	} from '$lib/utils/render';
	import Vector2InputControl from '$lib/Vector2InputControl.svelte';
	import Vector3InputControl from '$lib/Vector3InputControl.svelte';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { Heading, P, Tooltip } from 'flowbite-svelte';
	import { InfoCircleOutline } from 'flowbite-svelte-icons';
	import { getContext } from 'svelte';

	type Props = {
		parameters: RenderParameters;
	};

	const { parameters }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	/*
    	image_dimensions: [number, number];
	    tile_dimensions: [number, number];
	    gamma_correction: number;
	    samples_per_checkpoint: number;
	    total_checkpoints: number;
	    saved_checkpoint_limit?: number;
	    max_bounces: number;
	    use_scaling_truncation: boolean;
    */

	let testValues = $state<[number, number, number]>([1, 2, 3]);
</script>

{#snippet controlsParameters(data: RenderParameters)}
	<VectorInputControl
		label="Size"
		bind:values={data.image_dimensions}
		valueLabels={['width', 'height']}
	/>
	<VectorInputControl
		label="Tile Size"
		bind:values={data.tile_dimensions}
		valueLabels={['width', 'height']}
	/>
	<VectorInputControl
		label="Test Item"
		bind:values={testValues}
		valueLabels={['width', 'height BUT REALLY LONG TEXT', 'bazings']}
	/>

	<!-- <RangeControl
		label="Vertical FOV (degrees)"
		bind:value={data.vertical_field_of_view_degrees}
		min={10.0}
		max={170.0}
		step={1.0}
	/>
	<Vector3InputControl
		label="Eye"
		bind:value={data.eye_location}
		valueLabels={['X', 'Y', 'Z']}
	/>
	<Vector3InputControl
		label="Target"
		bind:value={data.target_location}
		valueLabels={['X', 'Y', 'Z']}
	/>
	<Vector3InputControl
		label="View Up"
		bind:value={data.view_up}
		valueLabels={['X', 'Y', 'Z']}
	/>
	<RangeControl
		label="Defocus Angle (degrees)"
		bind:value={data.defocus_angle_degrees}
		min={0.0}
		step={1.0}
	>
		{#snippet labelPrefix()}
			<InfoCircleOutline class="text-amber-400" />
			<Tooltip>
				<Heading tag="h6">Incorrect Preview</Heading>
				<P>Editing this property will not affect the preview.</P>
				<P
					>You may only be able to see this property's effects by creating a
					render.</P
				>
			</Tooltip>
		{/snippet}
	</RangeControl> -->
	<!-- <RangeControl label="Focus Distance" bind:value={data.focus_distance} /> -->
{/snippet}

<ControlsCard startExpanded leftLabel="parameters" leftLabelStyle="light">
	<div class="flex flex-col gap-2 p-4">
		<!-- controls -->
		{@render controlsParameters(parameters)}
	</div>
</ControlsCard>
