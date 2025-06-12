<script lang="ts">
	import { type RenderConfig } from '$lib/utils/render/config';
	import CameraControlsCard from './CameraControlsCard.svelte';
	import GeometricControlsCard from './GeometricControlsCard.svelte';
	import { Card, Heading, TabItem, Tabs } from 'flowbite-svelte';
	import ParametersControlsCard from './ParametersControlsCard.svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { z } from 'zod';
	import { getSceneData } from '$lib/utils/render/scene';
	import { getReferencedMaterialNames } from '$lib/utils/render/geometric';
	import MaterialControlsCard from './MaterialControlsCard.svelte';
	import { getReferencedTextureNames } from '$lib/utils/render/material';
	import TextureControlsCard from './TextureControlsCard.svelte';
	import { CirclePlusOutline } from 'flowbite-svelte-icons';
	import NewTextureSpeedDial from './NewTextureSpeedDial.svelte';
	import {
		getTopLevelGeometricNames,
		getTopLevelMaterialNames,
		getTopLevelTextureNames
	} from '$lib/utils/render/utils';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		renderConfig: RenderConfig;
	};

	const { superform, renderConfig }: Props = $props();

	const activeScene = $derived(
		getSceneData(renderConfig, renderConfig.active_scene)
	);

	const activeGeometricNames = $derived(activeScene.geometrics);
	const topLevelGeometricNames = $derived(
		getTopLevelGeometricNames(renderConfig)
	);
	const allGeometricNames = $derived(
		Object.keys(renderConfig.geometrics ?? {})
	);

	const activeMaterialNames = $derived([
		...new Set(
			activeGeometricNames.flatMap((geometricName) =>
				getReferencedMaterialNames(renderConfig, geometricName)
			)
		)
	]);
	const topLevelMaterialNames = $derived(
		getTopLevelMaterialNames(renderConfig)
	);
	const allMaterialNames = $derived(Object.keys(renderConfig.materials ?? {}));

	const activeTextureNames = $derived([
		...new Set(
			activeMaterialNames.flatMap((materialName) =>
				getReferencedTextureNames(renderConfig, materialName)
			)
		)
	]);
	const topLevelTextureNames = $derived(getTopLevelTextureNames(renderConfig));
	const allTextureNames = $derived(Object.keys(renderConfig.textures ?? {}));
</script>

<div class="flex flex-col">
	<Tabs
		tabStyle="pill"
		ulClass="justify-center mb-4"
		contentClass="!bg-zinc-900 border-t-[1px] border-zinc-600 rounded-none mt-0"
	>
		<TabItem open title="Parameters">
			<div class="flex flex-col items-center gap-4">
				<ParametersControlsCard {superform} />
			</div>
		</TabItem>
		<TabItem title="Camera">
			<div class="flex flex-col items-center gap-4">
				<CameraControlsCard {superform} camera={activeScene.camera} />
			</div>
		</TabItem>
		<TabItem title="Geometrics">
			<div class="flex flex-col items-center gap-4">
				{#each topLevelGeometricNames as geometricName (geometricName)}
					<GeometricControlsCard {superform} {geometricName} />
				{/each}
			</div>
		</TabItem>
		<TabItem title="Materials">
			<div class="flex flex-col items-center gap-4">
				{#each topLevelMaterialNames as materialName (materialName)}
					<MaterialControlsCard {superform} {materialName} />
				{/each}
			</div>
		</TabItem>
		<TabItem title="Textures">
			<div class="flex flex-col items-stretch gap-4">
				{#each topLevelTextureNames as textureName (textureName)}
					<TextureControlsCard {superform} {textureName} />
				{/each}
				<div class="flex flex-col-reverse items-end">
					<NewTextureSpeedDial {superform} />
				</div>
			</div>
		</TabItem>
	</Tabs>
</div>
