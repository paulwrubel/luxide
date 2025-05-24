<script lang="ts">
	import { mdiPlus } from '@mdi/js';
	import { Button, Spinner, Alert } from 'flowbite-svelte';
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

	const placeholderItem = Array.from({ length: 100 });
</script>

<div class="flex w-full flex-col p-12">
	{#if $allRendersQuery.isPending}
		<div class="flex w-full justify-center py-8">
			<Spinner size="12" color="primary" />
			<span class="ml-2">Loading renders...</span>
		</div>
	{:else if $allRendersQuery.isError}
		<Alert color="red" class="w-full">
			<span class="font-medium">Error loading renders</span>
		</Alert>
	{:else if $allRendersQuery.isSuccess}
		<div class="flex w-full flex-wrap justify-center gap-4">
			{#each $allRendersQuery.data as render}
				<div class="w-80">
					<RenderPreviewCard {render} />
				</div>
			{/each}
			<div class="w-80">
				<NewRenderCard />
			</div>
		</div>
	{/if}
</div>

<!-- using Tailwind classes directly in HTML instead of CSS -->
