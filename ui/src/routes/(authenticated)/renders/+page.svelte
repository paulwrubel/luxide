<script lang="ts">
	import { Spinner, Alert } from 'flowbite-svelte';
	import { auth } from '$lib/state/auth.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { getAllRenders } from '$lib/utils/api';
	import RenderPreviewCard from './RenderPreviewCard.svelte';
	import NewRenderCard from './NewRenderCard.svelte';

	const token = auth.validToken;
	const user = auth.validUser;

	const allRendersQuery = createQuery({
		queryKey: ['renders', token],
		queryFn: async () => {
			return await getAllRenders(token);
		}
	});

	const canCreateNewRender = $derived(
		user.max_renders === null ||
			($allRendersQuery.data !== undefined &&
				$allRendersQuery.data.length < user.max_renders)
	);
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
			{#if canCreateNewRender}
				<div class="w-80">
					<NewRenderCard />
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- using Tailwind classes directly in HTML instead of CSS -->
