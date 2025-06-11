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
	import type {
		FormPathArrays,
		FormPathLeaves,
		SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';
	import { getMaterialData } from '$lib/utils/render/material';
	import SelectControl from '$lib/SelectControl.svelte';
	import { getTextureData } from '$lib/utils/render/texture';
	import TextInputControl from '$lib/TextInputControl.svelte';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import InfoIconAdditionalInfo from '$lib/property-icons/InfoIconAdditionalInfo.svelte';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		textureName: string;
	};

	const { superform, textureName }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data: textureData } = $derived(
		getTextureData(renderConfig, textureName)
	);

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsTexture(name: string)}
	{@const { data } = getTextureData(renderConfig, name)}

	{#if data.type === 'checker'}
		{@render controlsTextureChecker(name)}
	{:else if data.type === 'image'}
		{@render controlsTextureImage(name)}
	{:else if data.type === 'color'}
		{@render controlsTextureSolidColor(name)}
	{/if}
{/snippet}

{#snippet controlsTextureChecker(name: string)}
	<TextInputControl
		{superform}
		field={`textures.${name}.scale` as FormPathLeaves<
			z.infer<typeof schema>,
			number
		>}
		label="Scale"
		valueLabel="scale"
		type="number"
	/>
	{@const items = Object.keys(renderConfig.textures ?? {}).map((key) => ({
		name: key,
		value: key
	}))}
	<SelectControl
		{superform}
		field={`textures.${name}.even_texture` as FormPathLeaves<
			z.infer<typeof schema>,
			string
		>}
		label="Texture 1"
		items={[...items]}
	/>
	<SelectControl
		{superform}
		field={`textures.${name}.odd_texture` as FormPathLeaves<
			z.infer<typeof schema>,
			string
		>}
		label="Texture 2"
		items={[...items]}
	/>
{/snippet}

{#snippet controlsTextureImage(name: string)}
	<!-- TODO -->
{/snippet}

{#snippet controlsTextureSolidColor(name: string)}
	<TextArrayInputControl
		{superform}
		field={`textures.${name}.color` as FormPathArrays<z.infer<typeof schema>>}
		label="Color"
		valueLabels={['red', 'green', 'blue']}
		type="number"
		unenforcedStep={0.01}
	>
		{#snippet labelSuffix()}
			<InfoIconAdditionalInfo
				info={[
					'Color values are typically between 0 and 1. For example, pure white would be [1, 1, 1].',
					'Values can be set outside of this range, and will be affected by the "Use Scaling Truncation" parameter.',
					'In the case of emissive textures, these values linearly correspond to the intensity of the emitted light.'
				]}
			/>
		{/snippet}
	</TextArrayInputControl>
{/snippet}

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if typeof textureName === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{textureName}
			</Heading>
		{:else}
			<Heading tag="h2" class="text-xl font-light italic">inline</Heading>
		{/if}
		<div class="flex flex-row">
			<Heading tag="h3" class="text-lg font-light italic">
				{textureData.type}
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
				{@render controlsTexture(textureName)}
			</div>
		</div>
	{/if}
</Card>
