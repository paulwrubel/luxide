<script lang="ts">
	import { Icon } from '@smui/icon-button';
	// import { mdiInformation } from '@mdi/js';
	import { mdiPlus } from '@mdi/js';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Card, { Content, Media } from '@smui/card';
	import Fab from '@smui/fab';
	import { goto } from '$app/navigation';
	import { getToken } from '$lib/state/auth.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { getAllRenders } from '$lib/api';
	import RenderPreviewCard from './RenderPreviewCard.svelte';
	import NewRenderCard from './NewRenderCard.svelte';

	const authToken = getToken();

	const allRendersQuery = createQuery({
		queryKey: ['renders', authToken],
		queryFn: async () => {
			return await getAllRenders(authToken);
		}
	});

	const placeholderItem = Array.from({ length: 10 });
</script>

<main class="main-content">
	<Fab
		class="create-render-fab"
		onclick={() => {
			goto('/renders/new');
		}}
	>
		<Icon tag="svg" viewBox="0 0 24 24">
			<path fill="currentColor" d={mdiPlus} />
		</Icon>
	</Fab>
	<LayoutGrid fixedColumnWidth class="render-grid">
		{#if $allRendersQuery.isPending}
			<p>Loading...</p>
		{:else if $allRendersQuery.isError}
			<p>Error loading renders!!</p>
		{:else if $allRendersQuery.isSuccess}
			{#each $allRendersQuery.data as render}
				<Cell span={3}>
					<RenderPreviewCard {render} />
				</Cell>
			{/each}
			<Cell span={3}>
				<NewRenderCard />
			</Cell>
		{/if}
	</LayoutGrid>
</main>

<style>
	.main-content {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 1rem;
	}

	:global(.create-render-fab) {
		align-self: flex-end;
	}
</style>
