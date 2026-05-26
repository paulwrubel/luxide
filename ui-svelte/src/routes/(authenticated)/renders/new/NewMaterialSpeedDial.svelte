<script lang="ts">
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import {
		defaultMaterialForType,
		type MaterialData
	} from '$lib/utils/render/material';
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

	function handleNewMaterial(
		type: Exclude<MaterialData['type'], 'dielectric'>
	) {
		const newMaterials = defaultMaterialForType(type);
		const nextName = getNextUniqueName(
			$form.materials,
			`New ${capitalize(type)}`
		);

		$form.materials[nextName] = newMaterials;
	}
</script>

<SpeedDialTrigger transition={undefined}>
	{#snippet icon()}
		<PlusOutline size="xl" />
	{/snippet}
</SpeedDialTrigger>
<SpeedDial placement="top-end">
	<Listgroup active>
		<ListgroupItem
			disabled
			class="flex"
			onclick={() => {
				console.warn('dielectric material not implemented yet');
				// TODO: implement dielectric material
				// handleNewMaterial('dielectric')
			}}
		>
			<PlusOutline size="md" class="me-2" />
			Dielectric Material
		</ListgroupItem>
		<Tooltip><span>Dielectric Materials are not yet implemented</span></Tooltip>
		<ListgroupItem onclick={() => handleNewMaterial('lambertian')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Lambertian Material
		</ListgroupItem>
		<ListgroupItem onclick={() => handleNewMaterial('specular')} class="flex">
			<PlusOutline size="md" class="me-2" />
			Specular Material
		</ListgroupItem>
	</Listgroup>
</SpeedDial>
