<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import { type RenderConfig } from '$lib/utils/render/config';
	import { getContext } from 'svelte';
	import { getTextureData } from '$lib/utils/render/texture';

	type Props = {
		textureName: string;
	};

	const { textureName }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data } = getTextureData(renderConfig, textureName);
	const { type: textureType } = data;
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
