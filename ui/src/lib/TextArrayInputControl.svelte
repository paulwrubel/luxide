<script lang="ts">
	import { Heading, Helper } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import {
		type SuperForm,
		arrayProxy,
		type FormPathArrays
	} from 'sveltekit-superforms';
	import z from 'zod';
	import { RenderConfigSchema } from './utils/render';
	import TextInput from './TextInput.svelte';
	import { getGridColumnsTemplateForPercentage } from './utils';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		field: FormPathArrays<z.infer<typeof schema>>;
		type?: 'text' | 'number';
		label: string | Snippet;
		labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		valueLabels: string[];
	};

	const {
		superform,
		field,
		type = 'text',
		label,
		labelSpacePercentage = 40,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		valueLabels
	}: Props = $props();

	const {
		values: arrayValues,
		errors: arrayErrors,
		path,
		valueErrors
	} = $derived(arrayProxy(superform, field));

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
			{#each $arrayValues as _, i}
				<div class="flex flex-col">
					<TextInput
						{superform}
						field={`${path}[${i}]`}
						{type}
						valueLabel={valueLabels[i]}
						extraIsErrored={$arrayErrors && $arrayErrors.length > 0}
					/>
					{#if $valueErrors[i] && $valueErrors[i].length > 0}
						<Helper color="red">{$valueErrors[i].join(', ')}</Helper>
					{:else}
						<span class="h-4"></span>
					{/if}
				</div>
			{/each}
		</div>
		{#if $arrayErrors}
			<Helper color="red">{$arrayErrors?.join(', ')}</Helper>
		{:else}
			<span class="h-4"></span>
		{/if}
	</div>
</div>
