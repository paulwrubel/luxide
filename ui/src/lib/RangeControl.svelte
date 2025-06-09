<script lang="ts">
	import { Label, Range } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import { formFieldProxy } from 'sveltekit-superforms';
	import type { SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from './utils/render/config';
	import type { z } from 'zod';
	import type { FormPathLeaves } from 'sveltekit-superforms';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		field: FormPathLeaves<z.infer<typeof schema>, number>;
		label: string;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		min?: number;
		max?: number;
		step?: number;
	};

	const {
		superform,
		field,
		label,
		labelPrefix,
		labelSuffix,
		min,
		max,
		step
	}: Props = $props();

	const { value } = $derived(formFieldProxy(superform, field));

	// $inspect($value);
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
	<Range bind:value={$value as number} {min} {max} {step} />
</Label>
