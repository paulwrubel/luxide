<script lang="ts">
	import { Card, Spinner } from 'flowbite-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { getToken } from '$lib/state/auth.svelte';
	import { getLatestCheckpointImage } from '$lib/api';
	import type { Render } from '$lib/api';

	type Props = {
		render: Render;
	};

	const { render }: Props = $props();

	const authToken = getToken();

	const checkpointImageURLQuery = createQuery({
		queryKey: ['latestCheckpoint', render.id, authToken],
		queryFn: async () => {
			return await getLatestCheckpointImage(authToken, render.id).then((blob) => {
				return URL.createObjectURL(blob);
			});
		}
	});
</script>

<Card href={`/renders/${render.id}`} class="!bg-zinc-800 !text-zinc-200 hover:!bg-zinc-700">
	<!-- card image section -->
	<div class="flex w-full items-center justify-center p-2">
		{#if $checkpointImageURLQuery.isPending}
			{@const renderSize = render.config.parameters.image_dimensions}
			<div class="flex flex-col items-center justify-center p-4">
				<Spinner size="8" color="primary" />
				<span class="mt-2 text-sm">loading preview...</span>
			</div>
		{:else if $checkpointImageURLQuery.isError}
			{@const renderSize = render.config.parameters.image_dimensions}
			<img
				src="https://placehold.co/{renderSize[0]}x{renderSize[1]}?text=Error"
				alt="Render Error"
				class="max-h-48 w-full object-scale-down"
			/>
		{:else if $checkpointImageURLQuery.isSuccess}
			<img
				src={$checkpointImageURLQuery.data}
				alt="Render Preview"
				class="max-h-48 w-full object-scale-down"
			/>
		{/if}
	</div>

	<!-- card header section -->
	<div class="flex items-baseline justify-between border-t p-3">
		<h5 class="text-lg font-semibold">
			{render.id}
		</h5>
		<code class="text-sm font-light italic">
			{render.config.name}
		</code>
	</div>
</Card>

<!-- using Tailwind classes directly in HTML instead of CSS -->
