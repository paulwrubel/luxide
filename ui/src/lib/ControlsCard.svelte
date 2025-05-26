<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import Separator from './Separator.svelte';
	import type { Snippet } from 'svelte';

	type LabelType = 'bold' | 'light';

	type Props = {
		children: Snippet;
		startExpanded?: boolean;
		leftLabel?: string;
		leftLabelStyle?: LabelType;
		rightLabel?: string;
		rightLabelStyle?: LabelType;
	};

	const {
		children,
		startExpanded = false,
		leftLabel,
		leftLabelStyle = 'bold',
		rightLabel,
		rightLabelStyle = 'light'
	}: Props = $props();

	let isExpanded = $state(startExpanded);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}
</script>

{#snippet label(label: string, labelType: LabelType)}
	{#if labelType === 'bold'}
		<Heading tag="h2" class="text-xl font-bold">{label}</Heading>
	{:else}
		<Heading tag="h2" class="text-xl font-light italic">{label}</Heading>
	{/if}
{/snippet}

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if leftLabel}
			{@render label(leftLabel, leftLabelStyle)}
		{:else}
			<!-- empty span for spacing -->
			<span></span>
		{/if}
		<!-- {#if typeof leftLabel === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{leftLabel}
			</Heading>
		{:else}
			<Heading tag="h2" class="text-xl font-light italic">inline</Heading>
		{/if} -->
		<div class="flex flex-row">
			{#if rightLabel}
				{@render label(rightLabel, rightLabelStyle)}
			{/if}
			{#if isExpanded}
				<ChevronUpOutline class="h-8 w-auto" />
			{:else}
				<ChevronDownOutline class="h-8 w-auto" />
			{/if}
		</div>
	</button>
	{#if isExpanded}
		<div transition:slide={{ duration: 300 }}>
			<Separator />
			{@render children()}
		</div>
	{/if}
</Card>
