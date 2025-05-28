<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import OptionalControl from '$lib/OptionalControl.svelte';
	import WarningIconAdvancedProperty from '$lib/property-icons/WarningIconAdvancedProperty.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import ToggleControl from '$lib/ToggleControl.svelte';
	import { type RenderConfig } from '$lib/utils/render';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { getContext } from 'svelte';

	const user = auth.validUser;

	const renderConfig = getContext<RenderConfig>('renderConfig');
	const parameters = renderConfig.parameters;

	let savedCheckpointLimitLocal = $state(
		renderConfig.parameters.saved_checkpoint_limit ?? 1
	);

	const [x, y] = parameters.image_dimensions;
	const pixels = $derived(x * y);

	const pixelLimit = $derived(user.max_render_pixel_count);
	const maxCheckpoints = $derived(user.max_checkpoints_per_render);
</script>

<ControlsCard startExpanded leftLabel="parameters" leftLabelStyle="light">
	<div class="flex flex-col gap-2 p-4">
		<!-- controls -->
		<VectorInputControl
			label="Size"
			bind:value={parameters.image_dimensions}
			valueLabel={['width', 'height']}
			isErrored={pixelLimit !== null && pixels > pixelLimit}
			errorMessage="Image dimensions must not exceed {pixelLimit}"
		/>
		<VectorInputControl
			label="Tile Size"
			bind:value={parameters.tile_dimensions}
			valueLabel={['width', 'height']}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<VectorInputControl
			label="Gamma Correction"
			allowWrappingLabel
			labelSpacePercentage={70}
			bind:value={parameters.gamma_correction}
			valueLabel="gamma"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<VectorInputControl
			label="Samples Per Checkpoint"
			labelSpacePercentage={70}
			bind:value={parameters.samples_per_checkpoint}
			valueLabel="samples"
		/>
		<VectorInputControl
			label="Total Checkpoints"
			labelSpacePercentage={70}
			bind:value={parameters.total_checkpoints}
			valueLabel="checkpoints"
		/>
		<OptionalControl
			label="Enforce Checkpoint Limit?"
			checked={parameters.saved_checkpoint_limit !== undefined}
			onchange={(e) => {
				parameters.saved_checkpoint_limit = e.currentTarget.checked
					? savedCheckpointLimitLocal
					: undefined;
			}}
			disabled={maxCheckpoints !== null}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
			<VectorInputControl
				label="Saved Checkpoint Limit"
				labelSpacePercentage={70}
				bind:value={savedCheckpointLimitLocal}
				onchange={(e: Event & { currentTarget: HTMLInputElement }) => {
					parameters.saved_checkpoint_limit = parseInt(e.currentTarget.value);
				}}
				valueLabel="checkpoints"
				isErrored={maxCheckpoints !== null &&
					savedCheckpointLimitLocal > maxCheckpoints}
				errorMessage="No greater than {maxCheckpoints} checkpoints are permitted"
			>
				{#snippet labelSuffix()}
					<WarningIconAdvancedProperty />
				{/snippet}
			</VectorInputControl>
		</OptionalControl>
		{#if maxCheckpoints !== null}
			<Tooltip>
				As a non-admin user, you are limited to {maxCheckpoints} checkpoints saved
				per render.
			</Tooltip>
		{/if}
		<VectorInputControl
			label="Max Light Bounces"
			labelSpacePercentage={70}
			bind:value={parameters.max_bounces}
			valueLabel="bounces"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<ToggleControl
			label="Use Scaling Truncation"
			bind:checked={parameters.use_scaling_truncation}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</ToggleControl>
	</div>
</ControlsCard>
