<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import OptionalControl from '$lib/OptionalControl.svelte';
	import WarningIconAdvancedProperty from '$lib/property-icons/WarningIconAdvancedProperty.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import StringInputControl from '$lib/StringInputControl.svelte';
	import ToggleControl from '$lib/ToggleControl.svelte';
	import { type RenderConfig } from '$lib/utils/render';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import { render } from 'svelte/server';

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

	$inspect(parameters);
</script>

<ControlsCard startExpanded leftLabel="parameters" leftLabelStyle="light">
	<div class="flex flex-col gap-2 p-4">
		<!-- controls -->
		<StringInputControl
			label="Name"
			value={renderConfig.name}
			onchange={(v: string) => (renderConfig.name = v)}
			valueLabel="name"
			isErrored={renderConfig.name === ''}
			errorMessage="Render name must not be blank"
		/>
		<VectorInputControl
			label="Size"
			value={parameters.image_dimensions}
			onchange={(v: number[]) => {
				parameters.image_dimensions = v as [number, number];
			}}
			valueLabel={['width', 'height']}
			isErrored={pixelLimit !== null && pixels > pixelLimit}
			errorMessage="Image dimensions must not exceed {pixelLimit}"
		/>
		<VectorInputControl
			label="Tile Size"
			value={parameters.tile_dimensions}
			onchange={(v: number[]) => {
				parameters.tile_dimensions = v as [number, number];
			}}
			valueLabel={['width', 'height']}
			isErrored={parameters.tile_dimensions[0] < 1 ||
				parameters.tile_dimensions[0] > parameters.image_dimensions[0] ||
				parameters.tile_dimensions[1] < 1 ||
				parameters.tile_dimensions[1] > parameters.image_dimensions[1]}
			errorMessage={parameters.tile_dimensions[0] < 1 ||
			parameters.tile_dimensions[1] < 1
				? 'Tile dimensions must be at least 1 pixel'
				: `Tile dimensions must be at most ${parameters.image_dimensions[0]} x ${parameters.image_dimensions[1]} pixels`}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<VectorInputControl
			label="Gamma Correction"
			allowWrappingLabel
			labelSpacePercentage={70}
			value={parameters.gamma_correction}
			onchange={(v: number) => {
				parameters.gamma_correction = v;
			}}
			valueLabel="gamma"
			isErrored={parameters.gamma_correction < 1 ||
				parameters.gamma_correction > 5}
			errorMessage={parameters.gamma_correction < 1
				? 'Gamma correction must be at least 1'
				: 'Gamma correction must be at most 5'}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</VectorInputControl>
		<VectorInputControl
			label="Samples Per Checkpoint"
			labelSpacePercentage={70}
			value={parameters.samples_per_checkpoint}
			onchange={(v: number) => {
				parameters.samples_per_checkpoint = v;
			}}
			valueLabel="samples"
			isErrored={parameters.samples_per_checkpoint < 1 ||
				parameters.samples_per_checkpoint > 1000}
			errorMessage={parameters.samples_per_checkpoint < 1
				? 'At least 1 sample per checkpoint is required'
				: 'No greater than 1000 samples per checkpoint are allowed'}
		/>
		<VectorInputControl
			label="Total Checkpoints"
			labelSpacePercentage={70}
			value={parameters.total_checkpoints}
			onchange={(v: number) => {
				parameters.total_checkpoints = v;
			}}
			valueLabel="checkpoints"
			isErrored={parameters.total_checkpoints < 1 ||
				parameters.total_checkpoints > 1000}
			errorMessage={parameters.total_checkpoints < 1
				? 'No less than 1 checkpoint is allowed'
				: 'No greater than 1000 checkpoints are allowed'}
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
				value={savedCheckpointLimitLocal}
				onchange={(v: number) => {
					parameters.saved_checkpoint_limit = v;
					savedCheckpointLimitLocal = v;
				}}
				valueLabel="checkpoints"
				isErrored={savedCheckpointLimitLocal < 0 ||
					(maxCheckpoints !== null &&
						savedCheckpointLimitLocal > maxCheckpoints)}
				errorMessage={savedCheckpointLimitLocal < 0
					? 'Cannot save less than 0 checkpoints'
					: `No greater than ${maxCheckpoints} checkpoints are permitted`}
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
			value={parameters.max_bounces}
			onchange={(v: number) => {
				parameters.max_bounces = v;
			}}
			valueLabel="bounces"
			isErrored={parameters.max_bounces < 0 || parameters.max_bounces > 200}
			errorMessage={parameters.max_bounces < 0
				? 'No less than 0 bounces are permitted'
				: 'No greater than 200 bounces are permitted'}
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
