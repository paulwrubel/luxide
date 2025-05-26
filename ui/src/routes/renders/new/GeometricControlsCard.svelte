<script lang="ts">
	import {
		getGeometricData,
		type GeometricBox,
		type GeometricData,
		type GeometricInstanceRotate,
		type GeometricList,
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

{#snippet separatorVertical()}
	<div class="border-r-[1px] border-zinc-600"></div>
{/snippet}

{#snippet controlsSubGeometric(data: string | GeometricData, includeSeparator?: boolean)}
	{@const geometricData = getGeometricData(renderConfig, data)}

	{#if includeSeparator}
		{@render separator()}
	{/if}
	<div class="flex justify-between">
		<Heading tag="h2" class="text-lg font-bold italic">Affected Geometric</Heading>
		<div class="flex gap-2">
			{#if typeof data === 'string'}
				<Heading tag="h3" class="text-lg font-light not-italic">{data}</Heading>
			{:else}
				<Heading tag="h3" class="text-lg font-light italic">inline</Heading>
			{/if}
			{@render separatorVertical()}
			<Heading tag="h3" class="text-lg font-light italic">{geometricData.type}</Heading>
		</div>
	</div>
	{#if typeof data !== 'string'}
		{@render controlsGeometric(data)}
	{/if}
{/snippet}

{#snippet controlsGeometric(data: GeometricData)}
	{#if data.type === 'box'}
		{@render controlsGeometricBox(data)}
	{:else if data.type === 'list'}
		{@render controlsGeometricList(data)}
	{:else if data.type === 'rotate_x' || data.type === 'rotate_y' || data.type === 'rotate_z'}
		{@render controlsGeometricRotate(data)}
	{:else}
		<Heading tag="h6" class="text-sm">Unknown geometric! (or not yet implemented...)</Heading>
	{/if}
{/snippet}

{#snippet controlsGeometricBox(data: GeometricBox)}
	<div class="flex items-center gap-2">
		<Heading tag="h6" class="flex-1 whitespace-nowrap">Corner 1:</Heading>
		<div class="flex items-center gap-2">
			<Label class="mb-2 flex flex-col">
				<span class="px-2">X</span>
				<Input type="number" bind:value={data.a[0]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Y</span>
				<Input type="number" bind:value={data.a[1]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Z</span>
				<Input type="number" bind:value={data.a[2]} />
			</Label>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<Heading tag="h6" class="flex-1 whitespace-nowrap">Corner 2:</Heading>
		<div class="flex items-center gap-2">
			<Label class="mb-2 flex flex-col">
				<span class="px-2">X</span>
				<Input type="number" bind:value={data.b[0]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Y</span>
				<Input type="number" bind:value={data.b[1]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Z</span>
				<Input type="number" bind:value={data.b[2]} />
			</Label>
		</div>
	</div>
{/snippet}

{#snippet controlsGeometricList(data: GeometricList)}
	{#each data.geometrics as subGeometric, index}
		{@render controlsSubGeometric(subGeometric, index > 0)}
	{/each}
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

	{@render controlsSubGeometric(data.geometric)}
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
