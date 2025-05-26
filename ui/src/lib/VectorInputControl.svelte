<script lang="ts">
	import { Heading, Label, Input } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string | Snippet;
		values: number[];
		valueLabels: string[];
	};

	let { label, values = $bindable(), valueLabels }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Heading tag="h6" class="flex-3 mt-3 whitespace-nowrap font-normal">
		{#if typeof label === 'string'}
			{label}:
		{:else}
			{@render label()}:
		{/if}
	</Heading>
	<div class="flex-7 items-flex-end flex max-w-[70%] gap-2">
		{#each values as _, i}
			<Label
				class={`mb-2 flex max-w-[${(100 / values.length).toFixed(0)}%] flex-col`}
			>
				<span class="flex-1 overflow-hidden text-ellipsis text-nowrap px-2">
					{#if valueLabels[i]}
						{valueLabels[i]}
					{/if}
				</span>
				<Input type="number" bind:value={values[i]} />
			</Label>
		{/each}
	</div>
</div>
