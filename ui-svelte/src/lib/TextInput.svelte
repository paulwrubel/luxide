<script lang="ts">
	import { Label, Input } from 'flowbite-svelte';
	import {
		type SuperForm,
		type FormPathLeaves,
		formFieldProxy
	} from 'sveltekit-superforms';
	import z from 'zod';
	import type { RenderConfigSchema } from './utils/render/config';
	import type { FormEventHandler, ChangeEventHandler } from 'svelte/elements';

	type Props = {
		superform: SuperForm<z.infer<typeof RenderConfigSchema>>;
		field: FormPathLeaves<z.infer<typeof RenderConfigSchema>>;
		oninput?: FormEventHandler<HTMLInputElement>;
		onchange?: ChangeEventHandler<HTMLInputElement>;
		type: 'text' | 'number';
		valueLabel: string;
		extraIsErrored?: boolean;
		unenforcedStep?: number;
	};

	const {
		superform,
		field,
		oninput,
		onchange,
		type = 'text',
		valueLabel,
		extraIsErrored,
		unenforcedStep
	}: Props = $props();

	const { value, errors, constraints } = $derived(
		formFieldProxy(superform, field)
	);

	const step = $derived(
		unenforcedStep ??
			$constraints?.step ??
			(type === 'number' ? 'any' : undefined)
	);

	const modifiedConstraints = $derived({
		...$constraints,
		step: step
	});
</script>

<Label class={`mb-0 flex w-full flex-col`}>
	<span class="flex-1 overflow-hidden text-ellipsis px-2">
		{valueLabel}
	</span>
	<Input color={$errors || extraIsErrored ? 'red' : 'default'}>
		{#snippet children(props)}
			<input
				name={field}
				{type}
				aria-invalid={$errors || extraIsErrored ? true : undefined}
				bind:value={$value}
				{oninput}
				{onchange}
				{...modifiedConstraints}
				{...props}
			/>
		{/snippet}
	</Input>
</Label>
