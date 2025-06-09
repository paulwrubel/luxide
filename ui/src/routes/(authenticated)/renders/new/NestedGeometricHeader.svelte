<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import { type RenderConfig } from '$lib/utils/render/config';
	import { getContext } from 'svelte';
	import {
		type GeometricData,
		getGeometricData
	} from '$lib/utils/render/geometric';

	type Props = {
		geometricName: string;
	};

	const { geometricName }: Props = $props();

	const renderConfig = getContext<RenderConfig>('renderConfig');

	const { data } = getGeometricData(renderConfig, geometricName);
	const { type: geometricType } = data;
</script>

<div class="flex justify-between">
	<Heading tag="h2" class="text-lg font-bold italic"
		>Contained Geometric</Heading
	>
	<div class="flex gap-2">
		<Heading tag="h3" class="text-lg font-light not-italic">
			{geometricName}
		</Heading>
		<!-- {#if typeof data === 'string'}
			<Heading tag="h3" class="text-lg font-light not-italic">{data}</Heading>
		{:else}
			<Heading tag="h3" class="text-lg font-light italic">inline</Heading>
		{/if} -->
		<Separator vertical />
		<Heading tag="h3" class="text-lg font-light italic">{geometricType}</Heading
		>
	</div>
</div>
