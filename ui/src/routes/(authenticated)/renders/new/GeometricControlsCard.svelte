<script lang="ts">
	import NestedGeometricHeader from './NestedGeometricHeader.svelte';
	import RangeControl from '$lib/RangeControl.svelte';
	import Separator from '$lib/Separator.svelte';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { Button, Card, Heading } from 'flowbite-svelte';
	import {
		ChevronDownOutline,
		ChevronUpOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import { getContext } from 'svelte';
	import {
		getGeometricData,
		type GeometricList,
		type GeometricInstanceRotate,
		getGeometricDataSafe
	} from '$lib/utils/render/geometric';
	import type {
		FormPathArrays,
		FormPathLeaves,
		SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import SelectControl from '$lib/SelectControl.svelte';
	import { fixReferences, type RenderConfigContext } from './utils';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		geometricName: string;
	};

	const { superform, geometricName }: Props = $props();
	const { form } = $derived(superform);

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const { data: geometricData } = $derived(
		getGeometricDataSafe(renderConfigContext.get(), geometricName)
	);

	function handleDeleteGeometric(name: string) {
		let newForm = { ...$form };
		delete newForm.geometrics[name];

		newForm = fixReferences(newForm);
		$form = newForm;
	}

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsSubGeometric(name: string)}
	<NestedGeometricHeader geometricName={name} />
	{@render controlsGeometric(name, true)}
{/snippet}

{#snippet controlsGeometric(name: string, isSubGeometric: boolean)}
	{@const { data } = getGeometricData(renderConfigContext.get(), name)}

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
	{#if !isSubGeometric}
		{@render deleteGeometricButton(name)}
	{/if}
{/snippet}

{#snippet deleteGeometricButton(name: string)}
	<div class="flex w-full justify-end">
		<Button
			color="red"
			pill={true}
			onclick={() => handleDeleteGeometric(name)}
			class="p-2"
		>
			<TrashBinOutline class="h-6 w-6" />
		</Button>
	</div>
{/snippet}

{#snippet controlsMaterialSelect(name: string)}
	{@const items = Object.keys(renderConfigContext.get().materials ?? {}).map(
		(key) => ({
			name: key,
			value: key
		})
	)}
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
	{@const { data } = getGeometricData(renderConfigContext.get(), name)}
	{#each (data as GeometricList).geometrics as subName, index}
		{#if index > 0}
			<Separator />
		{/if}
		{@render controlsSubGeometric(subName)}
	{/each}
{/snippet}

{#snippet controlsGeometricRotate(name: string)}
	{@const { data } = getGeometricData(renderConfigContext.get(), name)}
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
			<div class="flex w-full flex-col gap-2 p-4">
				<!-- controls -->
				{@render controlsGeometric(geometricName, false)}
			</div>
		</div>
	{/if}
</Card>
