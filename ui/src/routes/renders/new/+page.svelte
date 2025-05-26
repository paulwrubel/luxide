<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { getDefaultRenderConfig } from '$lib/render';
	import { setContext } from 'svelte';
	import { postRender } from '$lib/api';
	import { getToken } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import Controls from './Controls.svelte';
	import { Sidebar, Button, Progressradial, Spinner } from 'flowbite-svelte';

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

<div class="flex h-full max-h-[calc(100vh-4rem)] w-full flex-1">
	<Sidebar
		divClass="!bg-inherit h-full"
		alwaysOpen
		position="static"
		class="w-128 z-10 !bg-zinc-900"
	>
		<div class="flex h-full flex-col items-stretch gap-2">
			<Controls {renderConfig} />
			<Button
				onclick={() => {
					handleCreateRender();
				}}
				disabled={isCreatingRender}
				class="mt-auto"
			>
				{#if isCreatingRender}
					<Spinner size="4" />
				{:else}
					Create Render
				{/if}
			</Button>
		</div>
	</Sidebar>
	<div
		class="m-8 flex flex-1 items-center justify-center"
		bind:clientWidth={containerWidth}
		bind:clientHeight={containerHeight}
	>
		<div
			style="width: {canvasSize[0]}px; height: {canvasSize[1]}px;"
			class="box-sizing border-1 border-zinc-500"
		>
			<Canvas>
				<Scene />
			</Canvas>
		</div>
	</div>
</div>
