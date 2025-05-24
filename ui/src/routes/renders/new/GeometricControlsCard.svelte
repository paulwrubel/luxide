<script lang="ts">
	import { getGeometricData, type GeometricData, type RenderConfig } from '$lib/render';
	import Card, { PrimaryAction } from '@smui/card';

	type Props = {
		renderConfig: RenderConfig;
		geometric: string | GeometricData;
	};

	const { renderConfig, geometric }: Props = $props();

	const geometricData = getGeometricData(renderConfig, geometric);

	let isExpanded = $state(false);
</script>

<Card class="card-container">
	<PrimaryAction onclick={() => {}}></PrimaryAction>
	{#if typeof geometric === 'string'}
		<h2 class="mdc-typography--headline6">
			{geometric}
		</h2>
		<h3 class="mdc-typography--subtitle2">
			{geometricData.type}
		</h3>
	{:else}
		<h2 class="mdc-typography--headline6">
			{geometricData.type}
		</h2>
	{/if}
	{#if isExpanded}{/if}
</Card>

<style>
	:global(.card-container) {
		display: flex;
		flex-direction: column;
		align-items: stretch;

		/* box-sizing: border-box; */

		/* border: 1px solid white;
		border-radius: 5%; */

		background-color: #333;

		padding: 1rem;
	}
</style>
