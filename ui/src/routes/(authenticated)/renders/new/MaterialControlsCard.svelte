<script lang="ts">
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
	import type { FormPathLeaves, SuperForm } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { getMaterialData } from '$lib/utils/render/material';
	import SelectControl from '$lib/SelectControl.svelte';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		materialName: string;
	};

	const { superform, materialName }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data: materialData } = $derived(
		getMaterialData(renderConfig, materialName)
	);

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsMaterial(name: string)}
	{@const { data } = getMaterialData(renderConfig, name)}

	{#if data.type === 'dielectric'}
		{@render controlsMaterialDielectric(name)}
	{:else if data.type === 'lambertian'}
		{@render controlsMaterialLambertian(name)}
	{:else if data.type === 'specular'}
		{@render controlsMaterialSpecular(name)}
	{/if}
{/snippet}

{#snippet controlsTextureSelects(name: string)}
	{@const items = Object.keys(renderConfig.textures ?? {}).map((key) => ({
		name: key,
		value: key
	}))}
	<SelectControl
		{superform}
		field={`materials.${name}.reflectance_texture` as FormPathLeaves<
			z.infer<typeof schema>,
			string
		>}
		label="Reflectance Texture"
		items={[...items]}
	/>
	<SelectControl
		{superform}
		field={`materials.${name}.emittance_texture` as FormPathLeaves<
			z.infer<typeof schema>,
			string
		>}
		label="Emittance Texture"
		items={[...items]}
	/>
{/snippet}

{#snippet controlsMaterialDielectric(name: string)}
	<RangeControl
		{superform}
		field={`materials.${name}.index_of_refraction` as FormPathLeaves<
			z.infer<typeof schema>,
			number
		>}
		label="Index of Refraction"
		min={1.0}
		max={10.0}
		step={0.01}
	/>
	{@render controlsTextureSelects(name)}
{/snippet}

{#snippet controlsMaterialLambertian(name: string)}
	{@render controlsTextureSelects(name)}
{/snippet}

{#snippet controlsMaterialSpecular(name: string)}
	<RangeControl
		{superform}
		field={`materials.${name}.roughness` as FormPathLeaves<
			z.infer<typeof schema>,
			number
		>}
		label="Roughness"
		min={0.0}
		max={1.0}
		step={0.01}
	/>
	{@render controlsTextureSelects(name)}
{/snippet}

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if typeof materialName === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{materialName}
			</Heading>
		{:else}
			<Heading tag="h2" class="text-xl font-light italic">inline</Heading>
		{/if}
		<div class="flex flex-row">
			<Heading tag="h3" class="text-lg font-light italic">
				{materialData.type}
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
				{@render controlsMaterial(materialName)}
			</div>
		</div>
	{/if}
</Card>
