<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import OptionalControl from '$lib/OptionalControl.svelte';
	import WarningIconAdvancedProperty from '$lib/property-icons/WarningIconAdvancedProperty.svelte';
	import { type RenderConfig, type RenderParameters } from '$lib/utils/render';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
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

	let savedCheckpointLimitLocal = $state(
		renderConfig.parameters.saved_checkpoint_limit ?? 1
	);
	// sync to real state object
	$effect(() => {
		console.log('running effect over: ', savedCheckpointLimitLocal);
		if (savedCheckpointLimitLocal !== undefined) {
			renderConfig.parameters.saved_checkpoint_limit =
				savedCheckpointLimitLocal;
		}
	});

	$inspect(savedCheckpointLimitLocal);
	$inspect(renderConfig.parameters.saved_checkpoint_limit);
</script>

{#snippet controlsParameters(data: RenderParameters)}
	<VectorInputControl
		label="Size"
		bind:value={data.image_dimensions}
		valueLabel={['width', 'height']}
	/>
	<VectorInputControl
		label="Tile Size"
		bind:value={data.tile_dimensions}
		valueLabel={['width', 'height']}
	>
		{#snippet labelPrefix()}
			<WarningIconAdvancedProperty />
		{/snippet}
	</VectorInputControl>
	<VectorInputControl
		label="Gamma Correction"
		allowWrappingLabel
		labelSpacePercentage={70}
		bind:value={data.gamma_correction}
		valueLabel="gamma"
	>
		{#snippet labelPrefix()}
			<WarningIconAdvancedProperty />
		{/snippet}
	</VectorInputControl>
	<VectorInputControl
		label="Samples Per Checkpoint"
		labelSpacePercentage={70}
		bind:value={data.samples_per_checkpoint}
		valueLabel="samples"
	/>
	<VectorInputControl
		label="Total Checkpoints"
		labelSpacePercentage={70}
		bind:value={data.total_checkpoints}
		valueLabel="checkpoints"
	/>
	<OptionalControl
		label="Enforce Checkpoint Limit?"
		enabled={data.saved_checkpoint_limit !== undefined}
		onchange={(e) => {
			renderConfig.parameters.saved_checkpoint_limit = e.currentTarget.checked
				? savedCheckpointLimitLocal
				: undefined;
		}}
	>
		<!-- <VectorInputControl
			label="Gamma Correction"
			allowWrappingLabel
			labelSpacePercentage={70}
			bind:value={data.gamma_correction}
			valueLabel="gamma"
		>
			{#snippet labelPrefix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl> -->
		<!-- <VectorInputControl
			label="Total Checkpoints"
			labelSpacePercentage={70}
			bind:value={data.total_checkpoints}
			valueLabel="checkpoints"
		/> -->
		<VectorInputControl
			label="Saved Checkpoint Limit"
			labelSpacePercentage={70}
			bind:value={savedCheckpointLimitLocal}
			valueLabel="checkpoints"
		>
			{#snippet labelPrefix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<!-- {#if renderConfig.parameters.saved_checkpoint_limit !== undefined} -->
		<!-- <VectorInputControl
			label="Saved Checkpoint Limit"
			labelSpacePercentage={70}
			bind:value={renderConfig.parameters.saved_checkpoint_limit as number}
			valueLabel="checkpoints"
		>
			{#snippet labelPrefix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl> -->
		<!-- {/if} -->
	</OptionalControl>
	<VectorInputControl
		label="Max Light Bounces"
		labelSpacePercentage={70}
		bind:value={data.max_bounces}
		valueLabel="bounces"
	>
		{#snippet labelPrefix()}
			<WarningIconAdvancedProperty />
		{/snippet}
	</VectorInputControl>
	<!-- <VectorInputControl
		label="Use Scaling Truncation"
		labelSpacePercentage={70}
		bind:value={data.use_scaling_truncation}
		valueLabel="use"
	>
		{#snippet labelPrefix()}
			<WarningIconAdvancedProperty />
		{/snippet}
	</VectorInputControl> -->

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
