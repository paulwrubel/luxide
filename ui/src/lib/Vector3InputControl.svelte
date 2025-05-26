<script lang="ts">
	import { Heading, Label, Input } from 'flowbite-svelte';

	type Props = {
		label: string;
		value: [number, number, number];
		valueLabels: [string, string, string];
	};

	let { label, value = $bindable(), valueLabels }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Heading tag="h6" class="mt-3 flex-1 whitespace-nowrap font-normal"
		>{label}:</Heading
	>
	<div class="flex items-center gap-2">
		<Label class="mb-2 flex flex-col">
			<span class="px-2">{valueLabels[0]}</span>
			<Input type="number" bind:value={value[0]} />
		</Label>
		<Label class="mb-2 flex flex-col">
			<span class="px-2">{valueLabels[1]}</span>
			<Input type="number" bind:value={value[1]} />
		</Label>
		<Label class="mb-2 flex flex-col">
			<span class="px-2">{valueLabels[2]}</span>
			<Input type="number" bind:value={value[2]} />
		</Label>
	</div>
</div>
