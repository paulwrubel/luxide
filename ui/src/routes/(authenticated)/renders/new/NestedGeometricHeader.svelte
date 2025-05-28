<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import {
		getGeometricData,
		type GeometricData,
		type RenderConfig
	} from '$lib/utils/render';
	import { getContext } from 'svelte';

	type Props = {
		data: string | GeometricData;
	};

	const { data }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { type: geometricType } = getGeometricData(renderConfig, data);
</script>

<div class="flex justify-between">
	<Heading tag="h2" class="text-lg font-bold italic"
		>Contained Geometric</Heading
	>
	<div class="flex gap-2">
		{#if typeof data === 'string'}
			<Heading tag="h3" class="text-lg font-light not-italic">{data}</Heading>
		{:else}
			<Heading tag="h3" class="text-lg font-light italic">inline</Heading>
		{/if}
		<Separator vertical />
		<Heading tag="h3" class="text-lg font-light italic">{geometricType}</Heading
		>
	</div>
</div>
