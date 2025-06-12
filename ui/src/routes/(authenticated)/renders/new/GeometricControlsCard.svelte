<script lang="ts">
	import NestedGeometricHeader from './NestedGeometricHeader.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import Separator from '$lib/Separator.svelte';
	import {
		RenderConfigSchema,
		type RenderConfig
	} from '$lib/utils/render/config';
	import { Card, Heading } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import { getContext } from 'svelte';
	import {
		getGeometricData,
		type GeometricList,
		type GeometricInstanceRotate
	} from '$lib/utils/render/geometric';
	import type {
		FormPathArrays,
		FormPathLeaves,
		SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import SelectControl from '$lib/SelectControl.svelte';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		geometricName: string;
	};

	const { superform, geometricName }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data: geometricData } = getGeometricData(renderConfig, geometricName);

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsSubGeometric(name: string)}
	<NestedGeometricHeader geometricName={name} />
	{@render controlsGeometric(name)}
{/snippet}

{#snippet controlsGeometric(name: string)}
	{@const { data } = getGeometricData(renderConfig, name)}

	{#if data.type === 'box'}
		{@render controlsGeometricBox(name)}
	{:else if data.type === 'list'}
		{@render controlsGeometricList(name)}
	{:else if data.type === 'rotate_x' || data.type === 'rotate_y' || data.type === 'rotate_z'}
		{@render controlsGeometricRotate(name)}
	{:else if data.type === 'parallelogram'}
		{@render controlsGeometricParallelogram(name)}
	{:else}
		<Heading tag="h6" class="text-sm"
			>Unknown or unimplemented geometric: {data.type}</Heading
		>
	{/if}
{/snippet}

{#snippet controlsMaterialSelect(name: string)}
	{@const items = Object.keys(renderConfig.materials ?? {}).map((key) => ({
		name: key,
		value: key
	}))}
	<SelectControl
		{superform}
		field={`geometrics.${name}.material` as FormPathLeaves<
			z.infer<typeof schema>,
			string
		>}
		label="Material"
		items={[...items]}
	/>
{/snippet}

{#snippet controlsGeometricBox(name: string)}
	<TextArrayInputControl
		{superform}
		field={`geometrics.${name}.a` as FormPathArrays<z.infer<typeof schema>>}
		label="Corner 1"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	<TextArrayInputControl
		{superform}
		field={`geometrics.${name}.b` as FormPathArrays<z.infer<typeof schema>>}
		label="Corner 2"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	{@render controlsMaterialSelect(name)}
{/snippet}

{#snippet controlsGeometricList(name: string)}
	{@const { data } = getGeometricData(renderConfig, name)}
	{#each (data as GeometricList).geometrics as subName, index}
		{#if index > 0}
			<Separator />
		{/if}
		{@render controlsSubGeometric(subName)}
	{/each}
{/snippet}

{#snippet controlsGeometricRotate(name: string)}
	{@const { data } = getGeometricData(renderConfig, name)}
	{@const rotateData = data as GeometricInstanceRotate}
	{#if 'degrees' in rotateData}
		<RangeControl
			{superform}
			field={`geometrics.${name}.degrees` as FormPathLeaves<
				z.infer<typeof schema>,
				number
			>}
			label="Degrees of Rotation"
			min={0.0}
			max={360.0}
			step={1.0}
		/>
	{:else}
		<RangeControl
			{superform}
			field={`geometrics.${name}.radians` as FormPathLeaves<
				z.infer<typeof schema>,
				number
			>}
			label="Radians of Rotation"
			min={0.0}
			max={2 * Math.PI}
			step={0.01}
		/>
	{/if}
	<Separator />
	{@render controlsSubGeometric(rotateData.geometric)}
{/snippet}

{#snippet controlsGeometricParallelogram(name: string)}
	<TextArrayInputControl
		{superform}
		field={`geometrics.${name}.lower_left` as FormPathArrays<
			z.infer<typeof schema>
		>}
		label="Lower Left"
		valueLabels={['x', 'y', 'z']}
		type="number"
	/>
	<TextArrayInputControl
		{superform}
		field={`geometrics.${name}.u` as FormPathArrays<z.infer<typeof schema>>}
		valueLabels={['x', 'y', 'z']}
		type="number"
	>
		{#snippet label()}
			<em>u</em> Vector
		{/snippet}
	</TextArrayInputControl>
	<TextArrayInputControl
		{superform}
		field={`geometrics.${name}.v` as FormPathArrays<z.infer<typeof schema>>}
		valueLabels={['x', 'y', 'z']}
		type="number"
	>
		{#snippet label()}
			<em>v</em> Vector
		{/snippet}
	</TextArrayInputControl>
	{@render controlsMaterialSelect(name)}
{/snippet}

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if typeof geometricName === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{geometricName}
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
				{@render controlsGeometric(geometricName)}
			</div>
		</div>
	{/if}
</Card>
