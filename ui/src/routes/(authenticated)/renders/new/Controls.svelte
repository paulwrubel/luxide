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
	import { getReferencedMaterialNames } from '$lib/utils/render/geometric';
	import MaterialControlsCard from './MaterialControlsCard.svelte';
	import { getReferencedTextureNames } from '$lib/utils/render/material';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		renderConfig: RenderConfig;
	};

	const { superform, renderConfig }: Props = $props();

	const activeScene = $derived(
		getSceneData(renderConfig, renderConfig.active_scene)
	);

	const geometricNames = $derived(activeScene.geometrics);
	const materialNames = $derived([
		...new Set(
			geometricNames.flatMap((geometricName) =>
				getReferencedMaterialNames(renderConfig, geometricName)
			)
		)
	]);
	const textureNames = $derived([
		...new Set(
			materialNames.flatMap((materialName) =>
				getReferencedTextureNames(renderConfig, materialName)
			)
		)
	]);
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
				{#each geometricNames as geometricName}
					<GeometricControlsCard {superform} {geometricName} />
				{/each}
			</div>
		</TabItem>
		<TabItem title="Materials">
			<div class="flex flex-col items-center gap-4">
				{#each materialNames as materialName}
					<MaterialControlsCard {superform} {materialName} />
				{/each}
			</div>
		</TabItem>
		<TabItem title="Textures">
			<div class="flex flex-col items-center gap-4">
				{#each textureNames as textureName}
					<!-- <TextureControlsCard {superform} {textureName} /> -->
				{/each}
			</div>
		</TabItem>
	</Tabs>
</div>
