<script lang="ts">
	import { Heading, Label, Input } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string | Snippet;
		value: [number, number];
		valueLabels: [string, string];
	};

	let { label, value = $bindable(), valueLabels }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Heading tag="h6" class="flex-3 mt-3 whitespace-nowrap font-normal">
		{#if typeof label === 'string'}
			{label}:
		{:else}
			{@render label()}:
		{/if}
	</Heading>
	<div class="flex-7 flex items-center gap-2">
		<Label class="mb-2 flex flex-col">
			<span class="px-2">{valueLabels[0]}</span>
			<Input type="number" bind:value={value[0]} />
		</Label>
		<Label class="mb-2 flex flex-col">
			<span class="px-2">{valueLabels[1]}</span>
			<Input type="number" bind:value={value[1]} />
		</Label>
	</div>
</div>
