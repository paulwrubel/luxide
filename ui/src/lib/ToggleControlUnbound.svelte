<script lang="ts">
	import { Heading, Toggle } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import type { FormEventHandler, ChangeEventHandler } from 'svelte/elements';

	type Props = {
		checked: boolean;
		oninput?: FormEventHandler<HTMLInputElement>;
		onchange?: ChangeEventHandler<HTMLInputElement>;
		label: string | Snippet;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		disabled?: boolean;
	};

	let {
		checked,
		oninput,
		onchange,
		label,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		disabled
	}: Props = $props();
</script>

<div class="flex max-w-full flex-col">
	<Toggle
		bind:checked
		{oninput}
		{onchange}
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
