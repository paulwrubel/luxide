<script lang="ts">
	import { type RenderConfig } from '$lib/utils/render/config';
	import CameraControlsCard from './CameraControlsCard.svelte';
	import GeometricControlsCard from './GeometricControlsCard.svelte';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import ParametersControlsCard from './ParametersControlsCard.svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { z } from 'zod';
	import { getSceneData } from '$lib/utils/render/scene';
	import MaterialControlsCard from './MaterialControlsCard.svelte';
	import TextureControlsCard from './TextureControlsCard.svelte';
	import NewTextureSpeedDial from './NewTextureSpeedDial.svelte';
	import {
		getTopLevelMaterialNames,
		getTopLevelTextureNames,
		removeDefaults
	} from '$lib/utils/render/utils';
	import NewMaterialSpeedDial from './NewMaterialSpeedDial.svelte';
	import NewGeometricSpeedDial from './NewGeometricSpeedDial.svelte';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		renderConfig: RenderConfig;
	};

	const { superform, renderConfig }: Props = $props();

	const activeScene = $derived(
		getSceneData(renderConfig, renderConfig.active_scene)
	);

	const activeGeometricNames = $derived(removeDefaults(activeScene.geometrics));

	const topLevelMaterialNames = $derived(
		removeDefaults(getTopLevelMaterialNames(renderConfig))
	);
	const topLevelTextureNames = $derived(
		removeDefaults(getTopLevelTextureNames(renderConfig))
	);
</script>

<div class="flex flex-col">
	<Tabs
		tabStyle="pill"
		ulClass="justify-center mb-4"
		contentClass="!bg-zinc-900 border-t-[1px] border-zinc-600 rounded-none mt-0"
	>
		<TabItem open title="Parameters">
			<div class="flex flex-col items-stretch gap-4">
				<ParametersControlsCard {superform} />
			</div>
		</TabItem>
		<TabItem title="Camera">
			<div class="flex flex-col items-stretch gap-4">
				<CameraControlsCard {superform} camera={activeScene.camera} />
			</div>
		</TabItem>
		<TabItem title="Geometrics">
			<div class="flex flex-col items-stretch gap-4">
				{#each activeGeometricNames as geometricName (geometricName)}
					<GeometricControlsCard {superform} {geometricName} />
				{/each}
				<div class="flex w-full justify-end">
					<NewGeometricSpeedDial {superform} />
				</div>
			</div>
		</TabItem>
		<TabItem title="Materials">
			<div class="flex flex-col items-stretch gap-4">
				{#each topLevelMaterialNames as materialName (materialName)}
					<MaterialControlsCard {superform} {materialName} />
				{/each}
				<div class="flex w-full justify-end">
					<NewMaterialSpeedDial {superform} />
				</div>
			</div>
		</TabItem>
		<TabItem title="Textures">
			<div class="flex flex-col items-stretch gap-4">
				{#each topLevelTextureNames as textureName (textureName)}
					<TextureControlsCard {superform} {textureName} />
				{/each}
				<div class="flex w-full justify-end">
					<NewTextureSpeedDial {superform} />
				</div>
			</div>
		</TabItem>
	</Tabs>
</div>
