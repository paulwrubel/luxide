<script lang="ts">
	import ControlsCard from '$lib/ControlsCard.svelte';
	import OptionalControlUnbound from '$lib/OptionalControlUnbound.svelte';
	import WarningIconAdvancedProperty from '$lib/property-icons/WarningIconAdvancedProperty.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import TextInputControl from '$lib/TextInputControl.svelte';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import ToggleControl from '$lib/ToggleControl.svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { z } from 'zod';
	import type { RenderConfigContext } from './utils';

	const schema = RenderConfigSchema;
	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
	};

	const { superform }: Props = $props();
	const { form } = superform;

	let user = auth.validUser;

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');
	const parameters = $derived(renderConfigContext.get().parameters);
	const savedCheckpointLimit = $derived(parameters.saved_checkpoint_limit ?? 1);

	// svelte-ignore state_referenced_locally
	let savedCheckpointLimitLocal = $state(savedCheckpointLimit);

	const maxCheckpoints = $derived(user.max_checkpoints_per_render);
</script>

<ControlsCard startExpanded leftLabel="parameters" leftLabelStyle="light">
	<div class="flex flex-col gap-2 p-4">
		<!-- controls -->
		<TextInputControl {superform} field="name" label="Name" valueLabel="name" />
		<TextArrayInputControl
			{superform}
			field="parameters.image_dimensions"
			label="Size"
			valueLabels={['width', 'height']}
			type="number"
		/>
		<TextArrayInputControl
			{superform}
			field="parameters.tile_dimensions"
			label="Tile Size"
			valueLabels={['width', 'height']}
			type="number"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</TextArrayInputControl>
		<TextInputControl
			{superform}
			field="parameters.gamma_correction"
			label="Gamma Correction"
			labelSpacePercentage={70}
			allowWrappingLabel
			valueLabel="gamma"
			type="number"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</TextInputControl>
		<TextInputControl
			{superform}
			field={'parameters.samples_per_checkpoint'}
			label="Samples Per Checkpoint"
			labelSpacePercentage={70}
			valueLabel="samples"
			type="number"
		/>
		<TextInputControl
			{superform}
			field={'parameters.total_checkpoints'}
			label="Total Checkpoints"
			labelSpacePercentage={70}
			valueLabel="checkpoints"
			type="number"
		/>
		<OptionalControlUnbound
			label="Enforce Checkpoint Limit?"
			checked={$form.parameters.saved_checkpoint_limit !== undefined}
			oninput={(e) => {
				$form.parameters.saved_checkpoint_limit = e.currentTarget.checked
					? savedCheckpointLimitLocal
					: undefined;
			}}
			disabled={maxCheckpoints !== null}
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
			<TextInputControl
				{superform}
				oninput={(e) => {
					savedCheckpointLimitLocal = Number(e.currentTarget.value);
				}}
				onchange={(e) => {
					savedCheckpointLimitLocal = Number(e.currentTarget.value);
				}}
				field="parameters.saved_checkpoint_limit"
				label="Saved Checkpoint Limit"
				labelSpacePercentage={70}
				valueLabel="checkpoints"
				type="number"
			>
				{#snippet labelSuffix()}
					<WarningIconAdvancedProperty />
				{/snippet}
			</TextInputControl>
		</OptionalControlUnbound>
		{#if maxCheckpoints !== null}
			<Tooltip>
				As a non-admin user, you are limited to {maxCheckpoints} checkpoints saved
				per render.
			</Tooltip>
		{/if}
		<TextInputControl
			{superform}
			field="parameters.max_bounces"
			label="Max Light Bounces"
			labelSpacePercentage={70}
			valueLabel="bounces"
			type="number"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</TextInputControl>
		<ToggleControl
			{superform}
			field="parameters.use_scaling_truncation"
			label="Use Scaling Truncation"
		>
			{#snippet labelSuffix()}
				<WarningIconAdvancedProperty />
			{/snippet}
		</ToggleControl>
	</div>
</ControlsCard>
