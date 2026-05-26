<script lang="ts">
	import { Heading, Toggle } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import { RenderConfigSchema } from './utils/render/config';
	import {
		formFieldProxy,
		type FormPathLeaves,
		type SuperForm
	} from 'sveltekit-superforms';
	import { z } from 'zod';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		field: FormPathLeaves<z.infer<typeof schema>, boolean>;
		label: string | Snippet;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		disabled?: boolean;
	};

	let {
		superform,
		field,
		label,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		disabled
	}: Props = $props();

	const { value } = formFieldProxy(superform, field);
</script>

<div class="flex max-w-full flex-col">
	<Toggle
		bind:checked={$value}
		{disabled}
		size="large"
		class="flex w-full items-center justify-between py-2"
	>
		{#snippet offLabel()}
			<Heading tag="h6" class="overflow-hidden font-normal">
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
		{/snippet}
	</Toggle>
</div>
