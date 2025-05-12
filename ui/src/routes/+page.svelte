<script lang="ts">
	import { Icon } from '@smui/icon-button';
	// import { mdiInformation } from '@mdi/js';
	import { mdiPlus } from '@mdi/js';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Card, { Content, Media } from '@smui/card';
	import Fab from '@smui/fab';
	import { goto } from '$app/navigation';
	const renders = [1, 2, 3, 4, 5];
</script>

<main class="main-content">
	<LayoutGrid fixedColumnWidth class="render-grid">
		{#each renders as _, i}
			<Cell span={3}>
				<Card>
					<Content>
						{`Render ${i}`}
					</Content>
					<Media>
						<img
							src="https://placehold.co/160x90?text=Render%20{i}"
							alt="Render"
							class="card-image"
						/>
					</Media>
				</Card>
			</Cell>
		{/each}
	</LayoutGrid>
	<Fab
		onclick={() => {
			goto('/renders/new');
		}}
	>
		<Icon tag="svg" viewBox="0 0 24 24">
			<path fill="currentColor" d={mdiPlus} />
		</Icon>
	</Fab>
</main>

<style>
	/* .main-content {
		height: 100vh;
	} */

	.card-image {
		width: 100%;
		height: 100%;
	}
</style>
