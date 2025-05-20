<script lang="ts">
	import Drawer, { AppContent, Content } from '@smui/drawer';
	import { Canvas } from '@threlte/core';
	import Slider from '@smui/slider';
	import FormField from '@smui/form-field';
	import { getDefaultRenderConfig, getSceneData, getCameraData } from '$lib/render';
	import { onDestroy, setContext } from 'svelte';
	import Button from '@smui/button';
	import {
		getLatestCheckpointImage,
		getRender,
		isRenderStateCreated,
		isRenderStateFinishedCheckpointIteration,
		isRenderStatePaused,
		isRenderStatePausing,
		isRenderStateRunning
	} from '$lib/api';
	import { auth } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import CircularProgress from '@smui/circular-progress';
	import LinearProgress from '@smui/linear-progress';
	import { page } from '$app/state';

	// desired canvas dimensions
	let width = $state(500);
	let height = $state(500);
	let aspectRatio = $derived(width / height);

	// track container dimensions using state rune
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// calculate canvas dimensions using derived rune
	// const canvasSize = $derived.by(() => {
	// 	// if container isn't measured yet, return zeros
	// 	if (!containerWidth || !containerHeight) return [0, 0];

	// 	// calculate dimensions that fit in container while preserving aspect ratio
	// 	const containerAspectRatio = containerWidth / containerHeight;

	// 	if (containerAspectRatio > aspectRatio) {
	// 		// container is wider than desired ratio, so height is limiting factor
	// 		return [containerHeight * aspectRatio, containerHeight];
	// 	} else {
	// 		// container is taller than desired ratio, so width is limiting factor
	// 		return [containerWidth, containerWidth / aspectRatio];
	// 	}
	// });

	// store state
	// const renderConfig = $state(getDefaultRenderConfig());

	// setContext('renderConfig', renderConfig);

	// const activeScene = $derived(getSceneData(renderConfig, renderConfig.active_scene));
	// const camera = $derived(getCameraData(renderConfig, activeScene.camera));

	let imageBlob = $derived.by(async () => {
		if (auth.token === undefined) {
			throw new Error('YOU AINT LOGGED IN!');
		}

		return await getLatestCheckpointImage(auth.token, Number(page.params.id));
	});

	const imageURL = $derived.by(async () => {
		if (auth.token === undefined) {
			throw new Error('YOU AINT LOGGED IN!');
		}

		return URL.createObjectURL(await imageBlob);
	});

	let render = $derived.by(async () => {
		if (auth.token === undefined) {
			throw new Error('YOU AINT LOGGED IN!');
		}

		return await getRender(auth.token, Number(page.params.id));
	});

	$effect(() => {
		const intervalID = setInterval(() => {
			handleRefreshRender();
		}, 500);

		return () => {
			clearInterval(intervalID);
		};
	});

	onDestroy(async () => {
		const url = await imageURL;
		if (url) {
			URL.revokeObjectURL(url);
		}
	});

	let isRefreshingRender = $state(false);

	async function handleRefreshRender() {
		isRefreshingRender = true;

		if (auth.token === undefined) {
			goto('/');
			return;
		}

		render = getRender(auth.token, Number(page.params.id));
		imageBlob = getLatestCheckpointImage(auth.token, Number(page.params.id));

		Promise.allSettled([render, imageBlob]).finally(() => {
			isRefreshingRender = false;
		});
	}
</script>

<div class="view-container">
	<Drawer>
		<Content class="drawer-content">
			<!-- <FormField class="drawer-element">
				<Slider bind:value={width} min={100} max={5000} step={10} />
				Width = {width}
			</FormField>
			<FormField class="drawer-element">
				<Slider bind:value={height} min={100} max={5000} step={10} />
				Height = {height}
			</FormField>
			<FormField class="drawer-element">
				<Slider bind:value={camera.target_location[0]} min={0.0} max={1.0} step={0.01} />
				Target X = {camera.target_location[0]}
			</FormField> -->
			<Button
				onclick={() => {
					handleRefreshRender();
				}}
				disabled={isRefreshingRender}
				variant="raised"
				class="drawer-element drawer-element--end"
			>
				{#if isRefreshingRender}
					<CircularProgress />
				{:else}
					Refresh
				{/if}
			</Button>
		</Content>
	</Drawer>
	<AppContent class="app-content">
		<div
			class="app-content-sizing-container"
			bind:clientWidth={containerWidth}
			bind:clientHeight={containerHeight}
		>
			{#await imageURL then url}
				<img alt="Render" src={url} />
			{/await}
			{#await render then render}
				{@const state = render.state}
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
			{/await}
		</div>
	</AppContent>
</div>

<style>
	.view-container {
		display: flex;
		width: 100%;
		height: 100%;
	}

	:global(.drawer-content) {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 1rem;
	}

	:global(.drawer-element) {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	:global(.drawer-element--end) {
		margin-top: auto;
	}

	:global(.app-content) {
		flex: 1;
		padding: 1rem;
		display: flex;
		min-width: 0;
		overflow: hidden;
	}

	.app-content-sizing-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
