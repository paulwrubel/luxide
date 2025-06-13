<script lang="ts">
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import {
		defaultGeometricForType,
		type GeometricData
	} from '$lib/utils/render/geometric';
	import { capitalize, getNextUniqueName } from '$lib/utils/render/utils';
	import {
		Listgroup,
		ListgroupItem,
		SpeedDial,
		SpeedDialTrigger,
		Tooltip
	} from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { type SuperForm } from 'sveltekit-superforms';
	import { z } from 'zod';

	const schema = RenderConfigSchema;
	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
	};

	const { superform }: Props = $props();
	const { form } = $derived(superform);

	function handleNewGeometric(
		type: Exclude<GeometricData['type'], 'obj_model'>
	) {
		const newGeometric = defaultGeometricForType(type);
		const nextName = getNextUniqueName(
			$form.geometrics,
			`New ${capitalize(type)}`
		);

		const newForm = {
			...$form,
			geometrics: { ...$form.geometrics, [nextName]: newGeometric },
			scenes: {
				...$form.scenes,
				[$form.active_scene]: {
					...$form.scenes[$form.active_scene],
					geometrics: [...$form.scenes[$form.active_scene].geometrics, nextName]
				}
			}
		};

		$form = newForm;
	}
</script>

<SpeedDialTrigger transition={undefined}>
	{#snippet icon()}
		<PlusOutline size="xl" />
	{/snippet}
</SpeedDialTrigger>
<SpeedDial placement="top-end">
	<Listgroup active>
		<ListgroupItem onclick={() => handleNewGeometric('box')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Box
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('list')} class="flex">
			<PlusOutline size="md" class="me-2" />
			List
		</ListgroupItem>
		<ListgroupItem
			disabled
			class="flex"
			onclick={() => {
				console.warn('obj_model geometric not implemented yet');
				// TODO: implement obj_model geometric
				// handleNewGeometric('obj_model')
			}}
		>
			<PlusOutline size="md" class="me-2" />
			.obj Model
		</ListgroupItem>
		<Tooltip><span>.obj models are not yet implemented</span></Tooltip>
		<ListgroupItem onclick={() => handleNewGeometric('rotate_x')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Rotate X
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('rotate_y')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Rotate Y
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('rotate_z')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Rotate Z
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('translate')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Translate
		</ListgroupItem>
		<ListgroupItem
			onclick={() => handleNewGeometric('parallelogram')}
			class="flex"
		>
			<PlusOutline size="md" class="me-2" />
			Parallelogram
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('sphere')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Sphere
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewGeometric('triangle')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Triangle
		</ListgroupItem>
		<ListgroupItem
			onclick={() => handleNewGeometric('constant_volume')}
			class="flex"
		>
			<PlusOutline size="md" class="me-2" />
			Constant Volume
		</ListgroupItem>
	</Listgroup>
</SpeedDial>
