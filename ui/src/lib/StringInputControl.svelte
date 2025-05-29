<script lang="ts">
	import '../app.css';
	import { Heading, Label, Input, Helper } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string | Snippet;
		labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
		isErrored?: boolean;
		errorMessage?: string;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
		value: string;
		valueLabel: string;
		onchange?: (value: string) => void;
	};

	let {
		label,
		labelSpacePercentage = 40,
		isErrored,
		errorMessage,
		allowWrappingLabel,
		labelPrefix,
		labelSuffix,
		value = $bindable(),
		valueLabel = $bindable(),
		onchange: onChange
	}: Props = $props();

	function handleChanged(e: Event & { currentTarget: HTMLInputElement }) {
		onChange?.(e.currentTarget.value);
	}

	function getGridColumnsTemplateForPercentage(
		percentage: Props['labelSpacePercentage']
	): string {
		switch (percentage) {
			case 0:
				return 'grid-cols-[0fr_100fr]';
			case 10:
				return 'grid-cols-[10fr_90fr]';
			case 20:
				return 'grid-cols-[20fr_80fr]';
			case 30:
				return 'grid-cols-[30fr_70fr]';
			case 40:
				return 'grid-cols-[40fr_60fr]';
			case 50:
				return 'grid-cols-[50fr_50fr]';
			case 60:
				return 'grid-cols-[60fr_40fr]';
			case 70:
				return 'grid-cols-[70fr_30fr]';
			case 80:
				return 'grid-cols-[80fr_20fr]';
			case 90:
				return 'grid-cols-[90fr_10fr]';
			case 100:
				return 'grid-cols-[100fr_0fr]';
			default:
				return 'grid-cols-[30fr_70fr]';
		}
	}

	const gridStr = getGridColumnsTemplateForPercentage(labelSpacePercentage);
</script>

{#snippet labelledInput(label: string)}
	<Label class={`mb-0 flex w-full flex-col`}>
		<span class="flex-1 overflow-hidden text-ellipsis px-2">
			{label}
		</span>
		<Input type="text" color={isErrored ? 'red' : 'default'}>
			{#snippet children(props)}
				<input {...props} bind:value oninput={(e) => handleChanged(e)} />
			{/snippet}
		</Input>
	</Label>
{/snippet}

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
			{@render labelledInput(valueLabel)}
		</div>
		{#if isErrored && errorMessage}
			<Helper color="red">{errorMessage}</Helper>
		{:else}
			<span class="h-4"></span>
		{/if}
	</div>
</div>
