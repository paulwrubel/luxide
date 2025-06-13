<script lang="ts">
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
	import type {
		FormPathArrays,
		FormPathLeaves,
		SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';
	import {
		getTextureData,
		type TextureChecker
	} from '$lib/utils/render/texture';
	import TextInputControl from '$lib/TextInputControl.svelte';
	import TextArrayInputControl from '$lib/TextArrayInputControl.svelte';
	import InfoIconAdditionalInfo from '$lib/property-icons/InfoIconAdditionalInfo.svelte';
	import NestedTextureHeader from './NestedTextureHeader.svelte';
	import { fixReferences, type RenderConfigContext } from './utils';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		textureName: string;
	};

	const { superform, textureName }: Props = $props();
	const { form } = $derived(superform);

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const { data: textureData } = $derived(
		getTextureData(renderConfigContext.get(), textureName)
	);

	function handleDeleteTexture(name: string) {
		let newForm = { ...$form };
		delete newForm.textures[name];

		newForm = fixReferences(newForm);
		$form = newForm;
	}

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet controlsSubTexture(name: string)}
	<NestedTextureHeader textureName={name} />
	{@render controlsTexture(name, true)}
{/snippet}

{#snippet controlsTexture(name: string, isSubTexture: boolean)}
	{@const { data } = getTextureData(renderConfigContext.get(), name)}

	{#if data.type === 'checker'}
		{@render controlsTextureChecker(name)}
	{:else if data.type === 'image'}
		{@render controlsTextureImage(name)}
	{:else if data.type === 'color'}
		{@render controlsTextureSolidColor(name)}
	{/if}
	{#if !isSubTexture}
		{@render deleteTextureButton(name)}
	{/if}
{/snippet}

{#snippet deleteTextureButton(name: string)}
	<Button
		color="red"
		pill={true}
		onclick={() => handleDeleteTexture(name)}
		class="p-2"
	>
		<TrashBinOutline class="h-6 w-6" />
	</Button>
{/snippet}

{#snippet controlsTextureChecker(name: string)}
	{@const { data } = getTextureData(renderConfigContext.get(), name)}
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
	<Separator />
	{@render controlsSubTexture((data as TextureChecker).even_texture)}
	<Separator />
	{@render controlsSubTexture((data as TextureChecker).odd_texture)}
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
			<div class="flex flex-col items-start gap-2 p-4">
				<!-- controls -->
				{@render controlsTexture(textureName, false)}
			</div>
		</div>
	{/if}
</Card>
