<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import { getContext } from 'svelte';
	import { getTextureData } from '$lib/utils/render/texture';
	import type { RenderConfigContext } from './utils';

	type Props = {
		textureName: string;
	};

	const { textureName }: Props = $props();

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const { data } = $derived(
		getTextureData(renderConfigContext.get(), textureName)
	);
	const { type: textureType } = $derived(data);
</script>

<div class="flex justify-between">
	<Heading tag="h2" class="text-lg font-bold italic">Contained Texture</Heading>
	<div class="flex gap-2">
		<Heading tag="h3" class="text-lg font-light not-italic">
			{textureName}
		</Heading>
		<Separator vertical />
		<Heading tag="h3" class="text-lg font-light italic">
			{textureType}
		</Heading>
	</div>
</div>
