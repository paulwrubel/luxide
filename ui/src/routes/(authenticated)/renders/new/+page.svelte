<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';
	import { getDefaultRenderConfig } from '$lib/utils/render/templates';
	import { setContext } from 'svelte';
	import { postRender } from '$lib/utils/api';
	import { auth } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import Controls from './Controls.svelte';
	import { Sidebar, Spinner, Button } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import {
		syncronizeRenderConfig,
		updateFieldIfValid,
		updateFields
	} from './utils';
	import type { GeometricBox } from '$lib/utils/render/geometric';

	const { data }: PageProps = $props();

	const user = auth.validUser;

	// store state
	const renderConfig = $state(getDefaultRenderConfig());
	setContext('renderConfig', renderConfig);

	const schema = RenderConfigSchema.refine(
		({ parameters }) => {
			if (user.max_render_pixel_count !== null) {
				const [x, y] = parameters.image_dimensions;
				return x * y <= user.max_render_pixel_count;
			}
			return true;
		},
		{
			message: 'Image dimensions are too large',
			path: ['parameters', 'image_dimensions']
		}
	).refine(
		({ parameters }) => {
			if (user.max_checkpoints_per_render !== null) {
				return (
					parameters.saved_checkpoint_limit !== undefined &&
					parameters.saved_checkpoint_limit <= user.max_checkpoints_per_render
				);
			}
			return true;
		},
		{
			message: 'Saved checkpoint limit is too large',
			path: ['parameters', 'saved_checkpoint_limit']
		}
	);

	const superform = superForm(data.form, {
		SPA: true,
		dataType: 'json',
		validationMethod: 'auto',
		validators: zod(schema),
		resetForm: false,
		onChange: async (event) => {
			for (const path of event.paths) {
				const { deleted } = await updateFieldIfValid(
					superform,
					renderConfig,
					path,
					event.get(path)
				);

				// if something was deleted, then don't bother updating the form
				if (deleted) {
					console.log('deleted', path, 'exiting early!');
					return;
				}
			}
		}
	});
	const { enhance } = superform;

	const token = auth.validToken;

	let aspectRatio = $derived(
		renderConfig.parameters.image_dimensions[0] /
			renderConfig.parameters.image_dimensions[1]
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

		postRender(token, renderConfig)
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
		divClass="!bg-inherit h-full flex flex-col items-stretch !gap-2"
		alwaysOpen
		position="static"
		class="w-128 z-10 !bg-zinc-900"
	>
		<form use:enhance class="flex min-h-full flex-col items-stretch gap-2">
			<Controls {renderConfig} {superform} />
			<Separator class="mt-auto" />
			<Button
				onclick={() => {
					handleCreateRender();
				}}
				disabled={isCreatingRender}
			>
				{#if isCreatingRender}
					<Spinner size="4" />
				{:else}
					<span>Create Render</span>
				{/if}
			</Button>
		</form>
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
