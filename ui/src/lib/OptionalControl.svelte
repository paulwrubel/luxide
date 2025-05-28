<script lang="ts">
	import { Heading, Toggle } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import Separator from './Separator.svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import ToggleControl from './ToggleControl.svelte';

	type Props = {
		label: string | Snippet;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		checked: boolean;
		onchange?: ChangeEventHandler<HTMLInputElement>;
		disabled?: boolean;
		children: Snippet;
	};

	let {
		label,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		checked = $bindable(),
		onchange,
		disabled,
		children
	}: Props = $props();
</script>

<div class="flex max-w-full flex-col">
	<div class="h-[1px]">
		{#if checked}
			<div transition:fade={{ duration: 200 }}>
				<Separator />
			</div>
		{/if}
	</div>
	<ToggleControl
		{label}
		{allowWrappingLabel}
		{labelPrefix}
		{labelSuffix}
		{checked}
		{onchange}
		{disabled}
	/>
	{#if checked}
		<div transition:slide={{ duration: 300 }}>
			{@render children()}
		</div>
		<div transition:fade={{ duration: 200 }}>
			<Separator />
		</div>
	{/if}
</div>
