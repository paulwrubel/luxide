<script lang="ts">
	import { Drawer, Button, Spinner, Input, Sidebar } from 'flowbite-svelte';
	import DisplayRender from './DisplayRender.svelte';
	import { getToken } from '$lib/state/auth.svelte';
	import { page } from '$app/state';
	import {
		deleteRender,
		getLatestCheckpointImage,
		getRender,
		isRenderStatePaused,
		isRenderStatePausing,
		isRenderStateRunning,
		pauseRender,
		resumeRender,
		updateRenderTotalCheckpoints
	} from '$lib/api';
	// Replaced with Flowbite Input
	import { createQuery } from '@tanstack/svelte-query';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import Controls from './Controls.svelte';

	const AUTO_REFRESH_INTERVAL_MS = 1000;

	const authToken = getToken();

	const imageURLQuery = createQuery({
		queryKey: ['latestCheckpoint', Number(page.params.id), authToken],
		queryFn: async () => {
			return await getLatestCheckpointImage(authToken, Number(page.params.id)).then((blob) => {
				return URL.createObjectURL(blob);
			});
		},
		refetchInterval: AUTO_REFRESH_INTERVAL_MS
	});

	const renderQuery = createQuery({
		queryKey: ['render', Number(page.params.id), authToken],
		queryFn: async () => {
			return await getRender(authToken, Number(page.params.id));
		},
		refetchInterval: AUTO_REFRESH_INTERVAL_MS
	});

	onDestroy(async () => {
		const url = $imageURLQuery.data;
		if (url) {
			URL.revokeObjectURL(url);
		}
	});
</script>

<div class="flex h-full w-full flex-1">
	<Sidebar divClass="!bg-inherit" alwaysOpen position="static" class="z-10 !bg-zinc-900">
		{#if $renderQuery.isSuccess}
			<Controls render={$renderQuery.data} />
		{/if}
	</Sidebar>

	<div class="h-full min-w-0 flex-1 self-center p-4">
		<DisplayRender {renderQuery} {imageURLQuery} />
	</div>
</div>
