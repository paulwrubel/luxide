<script lang="ts">
	import '../app.css';
	import { Heading, Label, Input, Helper } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	type Props<T> = {
		label: string | Snippet;
		labelSpacePercentage?: 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
		isErrored?: boolean;
		errorMessage?: string;
		allowWrappingLabel?: boolean;
		labelPrefix?: Snippet;
		labelSuffix?: Snippet;
	} & (
		| {
				value: T[];
				valueLabel: string[];
				onchange?: (value: T, index: number) => void;
		  }
		| {
				value: T;
				valueLabel: string;
				onchange?: (value: T) => void;
		  }
	);

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
	}: Props<T> = $props();

	function handleChanged(
		e: Event & { currentTarget: HTMLInputElement },
		index?: number
	) {
		const eventValue = e.currentTarget.value;
		let eventValueT: T;
		if (typeof value === 'number') {
			eventValueT = parseInt(eventValue);

			if (isNaN(eventValueT)) {
				eventValueT = 0;
			}
		} else {
			eventValueT = eventValue;
		}

		if (onChange) {
			onChange(eventValue as T, index ?? 0);
		}
	}

	function getGridColumnsTemplateForPercentage(
		percentage: Props<T>['labelSpacePercentage']
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

	function isNonArrayT(value: T | T[]): value is T {
		return typeof value === 'string' || typeof value === 'number';
	}

	const gridStr = getGridColumnsTemplateForPercentage(labelSpacePercentage);
</script>

{#snippet labelledInput(label: string, index: number)}
	<Label class={`mb-0 flex w-full flex-col`}>
		<span class="flex-1 overflow-hidden text-ellipsis px-2">
			{label}
		</span>
		{#if isNonArrayT(value)}
			<Input
				type={inputType}
				bind:value
				onchange={handleChanged}
				color={isErrored ? 'red' : 'default'}
			/>
		{:else}
			<!-- for some reason, the type guard above isn't 
			     guaranteeing that value is T[] here -->
			{@const valueArr = value as T[]}
			<Input
				type={inputType}
				bind:value={valueArr[index]}
				onchange={(e) => handleChanged(e, index)}
				color={isErrored ? 'red' : 'default'}
			/>
		{/if}
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
			{#if typeof value === 'number' || typeof value === 'string'}
				{@render labelledInput(valueLabel as string, 0)}
			{:else}
				{#each value as _, i}
					{@render labelledInput(valueLabel[i], i)}
				{/each}
			{/if}
		</div>
		{#if isErrored && errorMessage}
			<Helper color="red">{errorMessage}</Helper>
		{:else}
			<span class="h-4"></span>
		{/if}
	</div>
</div>
