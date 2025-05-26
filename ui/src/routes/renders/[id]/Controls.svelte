<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		pauseRender,
		resumeRender,
		updateRenderTotalCheckpoints,
		isRenderStatePausing,
		isRenderStatePaused,
		isRenderStateRunning,
		deleteRender,
		type Render
	} from '$lib/utils/api';
	import { Button, Spinner, Input, Label } from 'flowbite-svelte';
	import { getToken } from '$lib/state/auth.svelte';
	import { page } from '$app/state';

	type Props = {
		render: Render;
	};

	const { render }: Props = $props();

	const authToken = getToken();

	let isPausingOrResumingRender = $state(false);
	async function handlePauseOrResumeRender() {
		isPausingOrResumingRender = true;
		if (isPaused || isPausing) {
			await resumeRender(authToken, Number(page.params.id));
		} else if (isRunning) {
			await pauseRender(authToken, Number(page.params.id));
		}
		isPausingOrResumingRender = false;
	}

	let newCheckpointLimitValue = $state<number>(
		render.config.parameters.total_checkpoints
	);

	let isUpdatingRenderTotalCheckpoints = $state(false);
	async function handleUpdateRenderTotalCheckpoints() {
		isUpdatingRenderTotalCheckpoints = true;
		await updateRenderTotalCheckpoints(
			authToken,
			Number(page.params.id),
			newCheckpointLimitValue
		);
		isUpdatingRenderTotalCheckpoints = false;
	}

	const isPausing = $derived(isRenderStatePausing(render.state));
	const isPaused = $derived(isRenderStatePaused(render.state));
	const isRunning = $derived(isRenderStateRunning(render.state));
</script>

<div class="flex h-full flex-col items-stretch gap-4">
	<Label class="block">
		<span class="mb-1 block">Checkpoint Limit</span>
		<Input
			type="number"
			required
			class="w-full"
			bind:value={newCheckpointLimitValue}
		/>
	</Label>

	<Button
		color="primary"
		outline
		onclick={handleUpdateRenderTotalCheckpoints}
		disabled={!Number.isInteger(newCheckpointLimitValue) ||
			newCheckpointLimitValue <= render.config.parameters.total_checkpoints}
		>Update</Button
	>
	<span class="mt-auto w-full border-b-[1px] border-b-zinc-600"></span>
	<div class="flex justify-evenly gap-2">
		<Button
			color={isPaused || isPausing ? 'primary' : 'amber'}
			outline
			onclick={handlePauseOrResumeRender}
			disabled={isPausingOrResumingRender ||
				!(isPaused || isPausing || isRunning)}
		>
			{#if isPausingOrResumingRender}
				<span class="flex items-center justify-center">
					<Spinner size="4" class="mr-2" />
					Processing...
				</span>
			{:else}
				{isPaused || isPausing ? 'Resume Render' : 'Pause Render'}
			{/if}
		</Button>
		<Button
			color="red"
			onclick={() => {
				deleteRender(authToken, Number(page.params.id)).then(() => {
					goto('/renders');
				});
			}}
			disabled={isPausing || isRunning}>Delete Render</Button
		>
	</div>
</div>
