<script lang="ts">
	import { getGeometricData, type GeometricData, type RenderConfig } from '$lib/render';
	import { Card, Heading, Label, Range } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';

	type Props = {
		renderConfig: RenderConfig;
		geometric: string | GeometricData;
	};

	const { renderConfig, geometric }: Props = $props();

	const geometricData = getGeometricData(renderConfig, geometric);

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if typeof geometric === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{geometric}
			</Heading>
		{:else}
			<span>
				<!-- empty to fill flex space -->
			</span>
		{/if}
		<div class="flex flex-row">
			<Heading tag="h3" class="text-lg font-light italic">
				{geometricData.type}
			</Heading>
			{#if isExpanded}
				<ChevronUpOutline class="h-8 w-auto" />
			{:else}
				<ChevronDownOutline class="h-8 w-auto" />
			{/if}
		</div>
	</button>
	{#if isExpanded}
		<div transition:slide={{ duration: 300 }}>
			<div class="mb-2 border-b-[1px] border-zinc-600"></div>
			<div class="flex flex-col gap-2 p-4">
				<!-- controls -->
				{#if geometricData.type === 'rotate_y'}
					{#if 'degrees' in geometricData}
						<Label class="flex flex-col">
							<span class="flex justify-between">
								<span>Degrees of Rotation</span>
								<span>{geometricData.degrees}</span>
							</span>
							<Range bind:value={geometricData.degrees} min={0.0} max={360.0} step={1.0} />
						</Label>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</Card>
