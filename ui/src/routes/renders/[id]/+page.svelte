<script lang="ts">
	import Drawer, { AppContent, Content } from '@smui/drawer';
	import Button from '@smui/button';
	import CircularProgress from '@smui/circular-progress';
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
	import Textfield from '@smui/textfield';
	import { createQuery } from '@tanstack/svelte-query';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

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

	let isPausingOrResumingRender = $state(false);
	async function handlePauseRender() {
		isPausingOrResumingRender = true;
		await pauseRender(authToken, Number(page.params.id));
		isPausingOrResumingRender = false;
	}
	async function handleResumeRender() {
		isPausingOrResumingRender = true;
		await resumeRender(authToken, Number(page.params.id));
		isPausingOrResumingRender = false;
	}

	let newCheckpointLimitValue = $state<number>(
		$renderQuery.data?.config.parameters.total_checkpoints ?? 0
	);

	let isUpdatingRenderTotalCheckpoints = $state(false);
	async function handleUpdateRenderTotalCheckpoints() {
		isUpdatingRenderTotalCheckpoints = true;
		await updateRenderTotalCheckpoints(authToken, Number(page.params.id), newCheckpointLimitValue);
		isUpdatingRenderTotalCheckpoints = false;
	}
</script>

<div class="view-container">
	<Drawer>
		<Content class="drawer-content">
			{#if $renderQuery.isSuccess && $renderQuery.data !== undefined}
				{@const isPausing = isRenderStatePausing($renderQuery.data.state)}
				{@const isPaused = isRenderStatePaused($renderQuery.data.state)}
				{@const isRunning = isRenderStateRunning($renderQuery.data.state)}
				<Button
					onclick={() => {
						if (isPaused || isPausing) {
							handleResumeRender();
						} else if (isRunning) {
							handlePauseRender();
						}
					}}
					disabled={isPausingOrResumingRender || !(isPaused || isPausing || isRunning)}
					variant="outlined"
					class="drawer-element--column"
				>
					{#if isPausingOrResumingRender}
						<CircularProgress />
					{:else}
						{isPaused || isPausing ? 'Resume Render' : 'Pause Render'}
					{/if}
				</Button>
				<div class="drawer-element--row">
					<div class="drawer-element--column">
						<Textfield
							bind:value={newCheckpointLimitValue}
							invalid={!Number.isInteger(newCheckpointLimitValue)}
							updateInvalid
							label="Checkpoint Limit"
							type="number"
						></Textfield>
					</div>
					<Button
						onclick={() => {
							handleUpdateRenderTotalCheckpoints();
						}}
						disabled={!Number.isInteger(newCheckpointLimitValue) ||
							newCheckpointLimitValue <= $renderQuery.data.config.parameters.total_checkpoints}
						variant="outlined"
						class="drawer-element">Update</Button
					>
				</div>
				<Button
					onclick={() => {
						deleteRender(authToken, Number(page.params.id)).then(() => {
							goto('/renders');
						});
					}}
					disabled={isPausing || isRunning}
					variant="raised"
					class="drawer-element--end">Delete Render</Button
				>
			{/if}
		</Content>
	</Drawer>
	<AppContent class="app-content">
		<DisplayRender {renderQuery} {imageURLQuery} />
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
		gap: 1rem;
	}

	:global(.drawer-element--row) {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	:global(.drawer-element--column) {
		display: flex;
		flex-direction: column;
		align-items: center;
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
</style>
