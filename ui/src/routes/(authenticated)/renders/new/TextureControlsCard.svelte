<script lang="ts">
	import Separator from '$lib/Separator.svelte';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { Button, Card, Heading, Input } from 'flowbite-svelte';
	import {
		CheckOutline,
		ChevronDownOutline,
		ChevronUpOutline,
		PenOutline,
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
		let newForm = structuredClone($form) as z.infer<typeof schema>;
		delete newForm.textures[name];

		newForm = fixReferences(newForm);
		$form = newForm;
	}

	let isExpanded = $state(false);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}

	let isEditingName = $state(false);
	let newTextureName = $state(textureName);

	function handleUpdateName() {
		let newForm = structuredClone($form) as z.infer<typeof schema>;
		newForm.textures[newTextureName] = newForm.textures[textureName];
		delete newForm.textures[textureName];

		newForm = fixReferences(newForm, {
			oldName: textureName,
			newName: newTextureName,
			resourceType: 'texture'
		});

		$form = newForm;
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
	<div class="flex w-full justify-end">
		<Button
			color="red"
			pill={true}
			onclick={() => handleDeleteTexture(name)}
			class="p-2"
		>
			<TrashBinOutline class="h-6 w-6" />
		</Button>
	</div>
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
		<div class="flex items-baseline gap-2">
			{#if isEditingName}
				<Input
					bind:value={newTextureName}
					onclick={(e) => {
						e.stopPropagation();
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.stopPropagation();
							isEditingName = false;
							handleUpdateName();
						}
					}}
				/>
				<Button
					color="secondary"
					pill
					outline
					onclick={(e) => {
						e.stopPropagation();
						isEditingName = false;
						handleUpdateName();
					}}
					class="border-none p-2"
				>
					<CheckOutline size="sm" />
				</Button>
			{:else}
				<Heading tag="h2" class="text-xl font-bold">
					{textureName}
				</Heading>
				<Button
					color="secondary"
					pill
					outline
					onclick={(e) => {
						e.stopPropagation();
						isEditingName = true;
					}}
					class="border-none p-2"
				>
					<PenOutline size="sm" />
				</Button>
			{/if}
		</div>
		<div class="flex">
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
				{@render controlsTexture(textureName, false)}
			</div>
		</div>
	{/if}
</Card>
