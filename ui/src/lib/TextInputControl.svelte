<script lang="ts">
	import { Heading, Helper } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import {
		formFieldProxy,
		type FormPathLeaves,
		type SuperForm
	} from 'sveltekit-superforms';
	import type { z } from 'zod';
	import { RenderConfigSchema } from '$lib/utils/render';
	import TextInput from './TextInput.svelte';
	import { getGridColumnsTemplateForPercentage } from './utils';
	import type { ChangeEventHandler, FormEventHandler } from 'svelte/elements';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		field: FormPathLeaves<z.infer<typeof schema>>;
		oninput?: FormEventHandler<HTMLInputElement>;
		onchange?: ChangeEventHandler<HTMLInputElement>;
		type?: 'text' | 'number';
		label: string | Snippet;
		labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		valueLabel: string;
	};

	const {
		superform,
		field,
		oninput,
		onchange,
		type = 'text',
		label,
		labelSpacePercentage = 40,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		valueLabel
	}: Props = $props();

	const { errors } = $derived(formFieldProxy(superform, field));

	const gridStr = getGridColumnsTemplateForPercentage(labelSpacePercentage);
</script>

<div class={['grid items-center', gridStr]}>
	<Heading tag="h6" class="mt-3 overflow-hidden font-normal">
		<span
			class={[
				'flex items-center gap-2',
				allowWrappingLabel ? 'whitespace-normal' : 'whitespace-nowrap'
			]}
		>
			{#if labelPrefix}
				{@render labelPrefix()}
			{/if}
			{#if typeof label === 'string'}
				{label}
			{:else}
				{@render label()}
			{/if}
			{#if labelSuffix}
				{@render labelSuffix()}
			{/if}
		</span>
	</Heading>
	<div class="flex flex-col">
		<div class="items-flex-end flex gap-2">
			<TextInput {superform} {oninput} {onchange} {field} {type} {valueLabel} />
		</div>
		{#if $errors}
			<Helper color="red">{$errors?.join(', ')}</Helper>
		{:else}
			<span class="h-4"></span>
		{/if}
	</div>
</div>
