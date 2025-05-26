<script lang="ts">
	import { Label, Range } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		value: number;
		min?: number;
		max?: number;
		step?: number;
	};

	let {
		label,
		labelPrefix,
		labelSuffix,
		value = $bindable(),
		min,
		max,
		step
	}: Props = $props();
</script>

<Label class="mb-2 flex flex-col gap-1.5">
	<span class="flex justify-between">
		<span class="flex gap-2">
			{#if labelPrefix}
				{@render labelPrefix()}
			{/if}
			{label}
			{#if labelSuffix}
				{@render labelSuffix()}
			{/if}
		</span>
		<span>{value}</span>
	</span>
	<Range bind:value {min} {max} {step} />
</Label>
