<script lang="ts">
	import {
		getGeometricData,
		type GeometricBox,
		type GeometricData,
		type GeometricInstanceRotate,
		type RenderConfig
	} from '$lib/render';
	import { Card, Heading, Input, Label, Range } from 'flowbite-svelte';
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

{#snippet separator()}
	<div class="border-b-[1px] border-zinc-600"></div>
{/snippet}

{#snippet controlsGeometric(data: GeometricData)}
	{#if data.type === 'box'}
		{@render controlsGeometricBox(data)}
	{:else if data.type === 'rotate_x' || data.type === 'rotate_y' || data.type === 'rotate_z'}
		{@render controlsGeometricRotate(data)}
	{:else}
		<Heading tag="h6" class="text-sm">Unknown geometric! (or not yet implemented...)</Heading>
	{/if}
{/snippet}

{#snippet controlsGeometricBox(data: GeometricBox)}
	<Label class="mb-2 flex flex-col">
		<span class="flex justify-between">
			<span>Width</span>
			<span>{data.a[0]}</span>
		</span>
		<Input bind:value={data.a[0]} min={0.0} max={1.0} step={0.01} />
	</Label>
	<Label class="mb-2 flex flex-col">
		<span class="flex justify-between">
			<span>Height</span>
			<span>{data.a[1]}</span>
		</span>
		<Range bind:value={data.a[1]} min={0.0} max={1.0} step={0.01} />
	</Label>
	<Label class="mb-2 flex flex-col">
		<span class="flex justify-between">
			<span>Depth</span>
			<span>{data.a[2]}</span>
		</span>
		<Range bind:value={data.a[2]} min={0.0} max={1.0} step={0.01} />
	</Label>
{/snippet}

{#snippet controlsGeometricRotate(data: GeometricInstanceRotate)}
	{#if 'degrees' in data}
		<Label class="mb-2 flex flex-col">
			<span class="flex justify-between">
				<span>Degrees of Rotation</span>
				<span>{data.degrees}</span>
			</span>
			<Range bind:value={data.degrees} min={0.0} max={360.0} step={1.0} />
		</Label>
	{/if}
	{#if typeof data.geometric === 'string'}
		<Heading tag="h3" class="text-lg font-light italic">
			{data.geometric}
		</Heading>
	{:else}
		{@const subGeometric = data.geometric}
		{@render separator()}
		<div class="flex justify-between">
			<Heading tag="h2" class="text-lg font-bold italic">Affected Geometric</Heading>
			<Heading tag="h3" class="text-lg font-light italic">{subGeometric.type}</Heading>
		</div>
		{@render controlsGeometric(subGeometric)}
	{/if}
{/snippet}

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
			{@render separator()}
			<div class="flex flex-col gap-2 p-4">
				<!-- controls -->
				{@render controlsGeometric(geometricData)}
			</div>
		</div>
	{/if}
</Card>
