<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import Separator from '$lib/Separator.svelte';
	import { getContext } from 'svelte';
	import { getGeometricData } from '$lib/utils/render/geometric';
	import type { RenderConfigContext } from './utils';

	type Props = {
		geometricName: string;
	};

	const { geometricName }: Props = $props();

	const renderConfigContext = getContext<RenderConfigContext>('renderConfig');

	const { data } = $derived(
		getGeometricData(renderConfigContext.get(), geometricName)
	);
	const { type: geometricType } = $derived(data);
</script>

<div class="flex justify-between">
	<Heading tag="h2" class="text-lg font-bold italic">
		Contained Geometric
	</Heading>
	<div class="flex gap-2">
		<Heading tag="h3" class="text-lg font-light not-italic">
			{geometricName}
		</Heading>
		<Separator vertical />
		<Heading tag="h3" class="text-lg font-light italic">
			{geometricType}
		</Heading>
	</div>
</div>
