<script lang="ts">
	import Drawer, { AppContent, Content } from '@smui/drawer';
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import Slider from '@smui/slider';
	import FormField from '@smui/form-field';
	import { getDefaultRenderConfig, getSceneData, getCameraData } from '$lib/render';
	import { setContext } from 'svelte';
	import Button from '@smui/button';
	import { postRender } from '$lib/api';
	import { getToken } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import CircularProgress from '@smui/circular-progress';

	const authToken = getToken();

	// store state
	const renderConfig = $state(getDefaultRenderConfig());
	setContext('renderConfig', renderConfig);

	let aspectRatio = $derived(
		renderConfig.parameters.image_dimensions[0] / renderConfig.parameters.image_dimensions[1]
	);

	// track container dimensions
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// calculate canvas dimensions
	const canvasSize = $derived.by(() => {
		// if container isn't measured yet, return zeros
		if (!containerWidth || !containerHeight) return [0, 0];

		// calculate dimensions that fit in container while preserving aspect ratio
		const containerAspectRatio = containerWidth / containerHeight;

		if (containerAspectRatio > aspectRatio) {
			// container is wider than desired ratio, so height is limiting factor
			return [containerHeight * aspectRatio, containerHeight];
		} else {
			// container is taller than desired ratio, so width is limiting factor
			return [containerWidth, containerWidth / aspectRatio];
		}
	});

	const activeScene = $derived(getSceneData(renderConfig, renderConfig.active_scene));
	const camera = $derived(getCameraData(renderConfig, activeScene.camera));

	let isCreatingRender = $state(false);

	async function handleCreateRender() {
		isCreatingRender = true;

		postRender(authToken, renderConfig)
			.then((response) => {
				isCreatingRender = false;
				goto(`/renders/${response.id}`);
			})
			.catch(() => {
				isCreatingRender = false;
			});
	}
</script>

<div class="view-container">
	<Drawer>
		<Content class="drawer-content">
			<FormField class="drawer-element">
				<Slider
					bind:value={renderConfig.parameters.image_dimensions[0]}
					min={100}
					max={5000}
					step={10}
				/>
				Width = {renderConfig.parameters.image_dimensions[0]}
			</FormField>
			<FormField class="drawer-element">
				<Slider
					bind:value={renderConfig.parameters.image_dimensions[1]}
					min={100}
					max={5000}
					step={10}
				/>
				Height = {renderConfig.parameters.image_dimensions[1]}
			</FormField>
			<FormField class="drawer-element">
				<Slider bind:value={camera.target_location[0]} min={0.0} max={1.0} step={0.01} />
				Target X = {camera.target_location[0]}
			</FormField>
			<Button
				onclick={() => {
					handleCreateRender();
				}}
				disabled={isCreatingRender}
				variant="raised"
				class="drawer-element drawer-element--end"
			>
				{#if isCreatingRender}
					<CircularProgress />
				{:else}
					Create Render
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
			<div style="width: {canvasSize[0]}px; height: {canvasSize[1]}px;" class="canvas-container">
				<Canvas>
					<Scene />
				</Canvas>
			</div>
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
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.canvas-container {
		box-sizing: border-box;
		border: 1px solid var(--mdc-theme-surface-variant, #e7e0ec);
	}
</style>
