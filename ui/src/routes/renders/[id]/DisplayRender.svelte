<script lang="ts">
	import {
		isRenderStateCreated,
		isRenderStateFinishedCheckpointIteration,
		isRenderStatePaused,
		isRenderStatePausing,
		isRenderStateRunning,
		type Render
	} from '$lib/api';
	import type { CreateQueryResult } from '@tanstack/svelte-query';
	import { Progressbar, type ColorType } from 'flowbite-svelte';

	type Props = {
		renderQuery: CreateQueryResult<Render, Error>;
		imageURLQuery: CreateQueryResult<string, Error>;
	};

	const { renderQuery, imageURLQuery }: Props = $props();
</script>

{#snippet progressBar(progress: number, color: ColorType = 'primary')}
	<div class="w-full px-32">
		<Progressbar
			progress={progress * 100}
			precision={2}
			{color}
			animate
			tweenDuration={500}
			size="h-6"
			labelInside
			labelInsideClass="text-base text-center font-medium"
		/>
	</div>
{/snippet}

<div class="flex h-full flex-1 flex-col items-center justify-center gap-2 px-8">
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
			{@render progressBar(state.running.progress_info.progress, 'primary')}
			<p>
				Running to checkpoint {state.running.checkpoint_iteration} / {totalCheckpoints}
			</p>
		{:else if isRenderStateFinishedCheckpointIteration(state)}
			<p>
				Finished checkpoint {state.finished_checkpoint_iteration} / {totalCheckpoints}
			</p>
		{:else if isRenderStatePausing(state)}
			{@render progressBar(state.pausing.progress_info.progress, 'amber')}
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
