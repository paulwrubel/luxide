<script lang="ts">
	import Card, { Content, Media, PrimaryAction } from '@smui/card';
	import { createQuery } from '@tanstack/svelte-query';
	import { getToken } from '$lib/state/auth.svelte';
	import { getLatestCheckpointImage } from '$lib/api';
	import type { Render } from '$lib/api';
	import { goto } from '$app/navigation';

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

<Card class="render-card">
	<PrimaryAction onclick={() => goto(`/renders/${render.id}`)}>
		<Content class="card-content">
			<h2 class="mdc-typography--headline6">
				{render.id}
			</h2>
			<code class="mdc-typography--body1"
				><em>
					{render.config.name}
				</em>
			</code>
		</Content>
		<Media class="media">
			{@const renderSize = render.config.parameters.image_dimensions}
			{#if $checkpointImageURLQuery.isPending}
				<img
					src="https://placehold.co/{renderSize[0]}x{renderSize[1]}?text=Render%20{render.id}"
					alt="Render Placeholder"
					class="card-image"
				/>
			{:else if $checkpointImageURLQuery.isError}
				<img
					src="https://placehold.co/{renderSize[0]}x{renderSize[1]}?text=Render%20{render.id}"
					alt="Render Error Placeholder"
					class="card-image"
				/>
			{:else if $checkpointImageURLQuery.isSuccess}
				<img src={$checkpointImageURLQuery.data} alt="Render Preview" class="card-image" />
			{/if}
		</Media>
	</PrimaryAction>
</Card>

<style>
	/* :global(.render-card) {
		height: 200px;
	} */

	:global(.card-content) {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	:global(.card-content) * {
		margin: 0;
	}

	:global(.media) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.card-image {
		width: 100%;
		height: fit-content(100%);
		object-fit: scale-down;
	}
</style>
