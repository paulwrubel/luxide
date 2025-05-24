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
	} from '$lib/api';
	import { Button, Spinner, Input } from 'flowbite-svelte';
	import { getToken } from '$lib/state/auth.svelte';
	import { page } from '$app/state';

	type Props = {
		render: Render;
	};

	const { render }: Props = $props();

	const authToken = getToken();

	let isPausingOrResumingRender = $state(false);
	async function handlePauseRender() {
		isPausingOrResumingRender = true;
		await pauseRender(authToken, Number(page.params.id));
		isPausingOrResumingRender = false;
	}
	async function handleResumeRender() {
		isPausingOrResumingRender = true;
		await resumeRender(authToken, Number(page.params.id));
		isPausingOrResumingRender = false;
	}

	let newCheckpointLimitValue = $state<number>(render.config.parameters.total_checkpoints);

	let isUpdatingRenderTotalCheckpoints = $state(false);
	async function handleUpdateRenderTotalCheckpoints() {
		isUpdatingRenderTotalCheckpoints = true;
		await updateRenderTotalCheckpoints(authToken, Number(page.params.id), newCheckpointLimitValue);
		isUpdatingRenderTotalCheckpoints = false;
	}

	const isPausing = $derived(isRenderStatePausing(render.state));
	const isPaused = $derived(isRenderStatePaused(render.state));
	const isRunning = $derived(isRenderStateRunning(render.state));
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<Button
		color="primary"
		outline
		onclick={() => {
			if (isPaused || isPausing) {
				handleResumeRender();
			} else if (isRunning) {
				handlePauseRender();
			}
		}}
		disabled={isPausingOrResumingRender || !(isPaused || isPausing || isRunning)}
		class="w-full"
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

	<div class="flex flex-col gap-2">
		<label class="text-sm font-medium" for="checkpoint-limit">Checkpoint Limit</label>
		<div class="flex gap-2">
			<Input
				id="checkpoint-limit"
				type="number"
				color={Number.isInteger(newCheckpointLimitValue) ? undefined : 'red'}
				class="w-full"
				bind:value={newCheckpointLimitValue}
			/>
			<Button
				color="primary"
				outline
				onclick={() => handleUpdateRenderTotalCheckpoints()}
				disabled={!Number.isInteger(newCheckpointLimitValue) ||
					newCheckpointLimitValue <= render.config.parameters.total_checkpoints}>Update</Button
			>
		</div>
	</div>

	<div class="mt-auto">
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
