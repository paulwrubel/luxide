<script lang="ts">
	import { Heading, Toggle } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import Separator from './Separator.svelte';
	import { fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	type Props = {
		label: string | Snippet;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		enabled: boolean;
		onchange?: ChangeEventHandler<HTMLInputElement>;
		children: Snippet;
	};

	let {
		label,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		enabled = $bindable(),
		onchange,
		children
	}: Props = $props();
</script>

<div class="flex max-w-full flex-col">
	{#if enabled}
		<Separator />
	{:else}
		<span class="h-[1px]"></span>
	{/if}
	<Toggle
		bind:checked={enabled}
		{onchange}
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
	{#if enabled}
		<div transition:slide={{ duration: 300 }}>
			{@render children()}
		</div>
		<Separator />
		<span class="h-[1px]"></span>
	{/if}
</div>
