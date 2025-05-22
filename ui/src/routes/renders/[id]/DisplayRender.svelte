<script lang="ts">
	import {
		isRenderStateCreated,
		isRenderStateFinishedCheckpointIteration,
		isRenderStatePaused,
		isRenderStatePausing,
		isRenderStateRunning,
		type Render
	} from '$lib/api';
	import LinearProgress from '@smui/linear-progress';
	import type { CreateQueryResult } from '@tanstack/svelte-query';

	type Props = {
		renderQuery: CreateQueryResult<Render, Error>;
		imageURLQuery: CreateQueryResult<string, Error>;
	};

	const { renderQuery, imageURLQuery }: Props = $props();
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
		{@const totalCheckpoints = $renderQuery.data.config.parameters.total_checkpoints}
		{#if isRenderStateCreated(state)}
			<p>CREATED</p>
		{:else if isRenderStateRunning(state)}
			<LinearProgress progress={state.running.progress_info.progress} />
			<p>
				Running to checkpoint {state.running.checkpoint_iteration} / {totalCheckpoints}
			</p>
		{:else if isRenderStateFinishedCheckpointIteration(state)}
			<p>
				Finished checkpoint {state.finished_checkpoint_iteration} / {totalCheckpoints}
			</p>
		{:else if isRenderStatePausing(state)}
			<LinearProgress progress={state.pausing.progress_info.progress} />
			<p>
				Pausing at checkpoint {state.pausing.checkpoint_iteration} / {totalCheckpoints}
			</p>
		{:else if isRenderStatePaused(state)}
			<p>
				Paused at checkpoint {state.paused} / {totalCheckpoints}
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
