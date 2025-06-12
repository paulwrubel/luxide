<script lang="ts">
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import {
		defaultTextureForType,
		type TextureData
	} from '$lib/utils/render/texture';
	import { capitalize, getNextUniqueName } from '$lib/utils/render/utils';
	import {
		Listgroup,
		ListgroupItem,
		SpeedDial,
		SpeedDialTrigger,
		Tooltip
	} from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import {
		fieldProxy,
		formFieldProxy,
		type SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';

	const schema = RenderConfigSchema;
	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
	};

	const { superform }: Props = $props();

	const textures = fieldProxy(superform, 'textures');

	function handleNewTexture(
		type: Exclude<TextureData['type'], 'checker' | 'image'>
	) {
		const newTexture = defaultTextureForType(type);
		const nextName = getNextUniqueName($textures, `New ${capitalize(type)}`);

		$textures[nextName] = newTexture;
	}
</script>

<SpeedDialTrigger transition={undefined}>
	{#snippet icon()}
		<PlusOutline size="xl" />
	{/snippet}
</SpeedDialTrigger>
<SpeedDial placement="top-end">
	<Listgroup active>
		<ListgroupItem
			disabled
			class="flex"
			onclick={() => {
				console.warn('checker texture not implemented yet');
				// TODO: implement checker texture
				// handleNewTexture('checker')
			}}
		>
			<PlusOutline size="md" class="me-2" />
			Checker Texture
		</ListgroupItem>
		<Tooltip><span>Checker Textures are not yet implemented</span></Tooltip>
		<ListgroupItem
			disabled
			onclick={() => {
				console.warn('image texture not implemented yet');
				// TODO: implement image texture
				// handleNewTexture('image')
			}}
			class="flex"
		>
			<PlusOutline size="md" class="me-2" />
			Image Texture
		</ListgroupItem>
		<Tooltip><span>Image Textures are not yet implemented</span></Tooltip>
		<ListgroupItem onclick={() => handleNewTexture('color')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Color Texture
		</ListgroupItem>
	</Listgroup>
</SpeedDial>
