<script lang="ts">
	import Drawer, { AppContent, Content } from '@smui/drawer';
	import Button from '@smui/button';
	import CircularProgress from '@smui/circular-progress';
	import DisplayRender from './DisplayRender.svelte';

	let isRefreshingRender = $state(false);
</script>

<div class="view-container">
	<Drawer>
		<Content class="drawer-content">
			<!-- <FormField class="drawer-element">
				<Slider bind:value={width} min={100} max={5000} step={10} />
				Width = {width}
			</FormField> --->
			<Button
				onclick={() => {
					// handleRefreshRender();
				}}
				disabled={isRefreshingRender}
				variant="raised"
				class="drawer-element drawer-element--end"
			>
				{#if isRefreshingRender}
					<CircularProgress />
				{:else}
					Refresh
				{/if}
			</Button>
		</Content>
	</Drawer>
	<AppContent class="app-content">
		<DisplayRender />
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
</style>
