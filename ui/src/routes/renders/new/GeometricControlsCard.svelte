<script lang="ts">
	import NestedGeometricHeader from './NestedGeometricHeader.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import Separator from '$lib/Separator.svelte';
	import {
		getGeometricData,
		type GeometricBox,
		type GeometricData,
		type GeometricInstanceRotate,
		type GeometricList,
		type GeometricParallelogram,
		type RenderConfig
	} from '$lib/utils/render';
	import VectorInputControl from '$lib/VectorInputControl.svelte';
	import { Card, Heading } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import { getContext } from 'svelte';

	type Props = {
		geometric: string | GeometricData;
	};

	const { geometric }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const geometricData = getGeometricData(renderConfig, geometric);

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsSubGeometric(data: string | GeometricData)}
	{@const geometricData = getGeometricData(renderConfig, data)}

	<NestedGeometricHeader {data} />
	{@render controlsGeometric(geometricData)}
{/snippet}

{#snippet controlsGeometric(data: GeometricData)}
	{#if data.type === 'box'}
		{@render controlsGeometricBox(data)}
	{:else if data.type === 'list'}
		{@render controlsGeometricList(data)}
	{:else if data.type === 'rotate_x' || data.type === 'rotate_y' || data.type === 'rotate_z'}
		{@render controlsGeometricRotate(data)}
	{:else if data.type === 'parallelogram'}
		{@render controlsGeometricParallelogram(data)}
	{:else}
		<Heading tag="h6" class="text-sm"
			>Unknown geometric! (or not yet implemented...)</Heading
		>
	{/if}
{/snippet}

{#snippet controlsGeometricBox(data: GeometricBox)}
	<VectorInputControl
		label="Corner 1"
		bind:values={data.a}
		valueLabels={['X', 'Y', 'Z']}
	/>
	<VectorInputControl
		label="Corner 2"
		bind:values={data.b}
		valueLabels={['X', 'Y', 'Z']}
	/>
{/snippet}

{#snippet controlsGeometricList(data: GeometricList)}
	{#each data.geometrics as subGeometric, index}
		{#if index > 0}
			<Separator />
		{/if}
		{@render controlsSubGeometric(subGeometric)}
	{/each}
{/snippet}

{#snippet controlsGeometricRotate(data: GeometricInstanceRotate)}
	{#if 'degrees' in data}
		<RangeControl
			label="Degrees of Rotation"
			bind:value={data.degrees}
			min={0.0}
			max={360.0}
			step={1.0}
		/>
	{:else}
		<RangeControl
			label="Radians of Rotation"
			bind:value={data.radians}
			min={0.0}
			max={2 * Math.PI}
			step={0.01}
		/>
	{/if}
	<Separator />
	{@render controlsSubGeometric(data.geometric)}
{/snippet}

{#snippet controlsGeometricParallelogram(data: GeometricParallelogram)}
	<VectorInputControl
		label="Lower Left"
		bind:values={data.lower_left}
		valueLabels={['X', 'Y', 'Z']}
	/>
	<VectorInputControl bind:values={data.u} valueLabels={['X', 'Y', 'Z']}>
		{#snippet label()}
			<em>u</em> Vector
		{/snippet}
	</VectorInputControl>
	<VectorInputControl bind:values={data.v} valueLabels={['X', 'Y', 'Z']}>
		{#snippet label()}
			<em>v</em> Vector
		{/snippet}
	</VectorInputControl>
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
			<Heading tag="h2" class="text-xl font-light italic">inline</Heading>
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
			<Separator />
			<div class="flex flex-col gap-2 p-4">
				<!-- controls -->
				{@render controlsGeometric(geometricData)}
			</div>
		</div>
	{/if}
</Card>
