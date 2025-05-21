<script>
	import { createQuery } from '@tanstack/svelte-query';
	import { auth } from '$lib/state/auth.svelte';
	import { page } from '$app/state';
	import {
		getLatestCheckpointImage,
		getRender,
		isRenderStateCreated,
		isRenderStateFinishedCheckpointIteration,
		isRenderStatePaused,
		isRenderStatePausing,
		isRenderStateRunning
	} from '$lib/api';
	import LinearProgress from '@smui/linear-progress';
	import { onDestroy } from 'svelte';

	const imageURLQuery = createQuery({
		queryKey: ['latestCheckpoint', Number(page.params.id)],
		queryFn: async () => {
			if (auth.token === undefined) {
				throw new Error('YOU AINT LOGGED IN!');
			}

			return await getLatestCheckpointImage(auth.token, Number(page.params.id)).then((blob) => {
				return URL.createObjectURL(blob);
			});
		},
		refetchInterval: 1000
	});

	const renderQuery = createQuery({
		queryKey: ['render', Number(page.params.id)],
		queryFn: async () => {
			if (auth.token === undefined) {
				throw new Error('YOU AINT LOGGED IN!');
			}
			return await getRender(auth.token, Number(page.params.id));
		},
		refetchInterval: 1000
	});

	onDestroy(async () => {
		const url = $imageURLQuery.data;
		if (url) {
			URL.revokeObjectURL(url);
		}
	});
</script>

<div class="app-content-sizing-container">
	{#if $imageURLQuery.isPending}
		<p>Loading...</p>
	{:else if $imageURLQuery.isError}
		<p>Error loading render!!</p>
	{:else if $imageURLQuery.isSuccess}
		<img alt="Render" src={$imageURLQuery.data} />
	{/if}

	{#if $renderQuery.isPending}
		<p>Loading...</p>
	{:else if $renderQuery.isError}
		<p>Error loading render!!</p>
	{:else if $renderQuery.isSuccess}
		{@const state = $renderQuery.data.state}
		{#if isRenderStateCreated(state)}
			<p>CREATED</p>
		{:else if isRenderStateRunning(state)}
			<LinearProgress progress={state.running.progress_info.progress} />
			<p>
				Running to checkpoint {state.running.checkpoint_iteration}
			</p>
		{:else if isRenderStateFinishedCheckpointIteration(state)}
			<p>
				Finished checkpoint {state.finished_checkpoint_iteration}
			</p>
		{:else if isRenderStatePausing(state)}
			<p>
				Pausing at checkpoint {state.pausing.checkpoint_iteration}
			</p>
		{:else if isRenderStatePaused(state)}
			<p>
				Paused at checkpoint {state.paused}
			</p>
		{/if}
	{/if}
</div>

<style>
	.app-content-sizing-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
