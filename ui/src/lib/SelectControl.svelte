<script lang="ts">
	import { Label, Select } from 'flowbite-svelte';
	import { onDestroy, type Snippet } from 'svelte';
	import { formFieldProxy } from 'sveltekit-superforms';
	import type { SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from './utils/render/config';
	import type { z } from 'zod';
	import type { FormPathLeaves } from 'sveltekit-superforms';

	const schema = RenderConfigSchema;

	type Item = {
		name: string;
		value: string;
	};

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		field: FormPathLeaves<z.infer<typeof schema>, string>;
		label: string;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		items: Item[];
	};

	const { superform, field, label, labelPrefix, labelSuffix, items }: Props =
		$props();

	let { value } = $derived(formFieldProxy(superform, field));
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
		<span>{$value}</span>
	</span>
	<Select bind:value={$value} {items} placeholder="" />
</Label>
