<script lang="ts">
	import { type RenderConfig } from '$lib/utils/render/config';
	import CameraControlsCard from './CameraControlsCard.svelte';
	import GeometricControlsCard from './GeometricControlsCard.svelte';
	import { Label, Range, TabItem, Tabs } from 'flowbite-svelte';
	import ParametersControlsCard from './ParametersControlsCard.svelte';
	import { type SuperForm } from 'sveltekit-superforms';
	import { RenderConfigSchema } from '$lib/utils/render/config';
	import { z } from 'zod';
	import { getCameraData } from '$lib/utils/render/camera';
	import { getSceneData } from '$lib/utils/render/scene';

	const schema = RenderConfigSchema;

	type Props = {
		superform: SuperForm<z.infer<typeof schema>>;
		renderConfig: RenderConfig;
	};

	const { superform, renderConfig }: Props = $props();

	const activeScene = $derived(
		getSceneData(renderConfig, renderConfig.active_scene)
	);

	// const { data: camera } = $derived(
	// 	getCameraData(renderConfig, activeScene.camera)
	// );

	// $inspect(camera);
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
				{#each activeScene.geometrics as geometric}
					<!-- <GeometricControlsCard {superform} {geometric} /> -->
				{/each}
			</div>
		</TabItem>
		<TabItem title="Materials">
			<div class="flex flex-col items-center gap-4">
				{#each activeScene.geometrics as geometric}
					<!-- <GeometricControlsCard {geometric} /> -->
				{/each}
			</div>
		</TabItem>
		<TabItem title="Textures">
			<div class="flex flex-col items-center gap-4">
				{#each activeScene.geometrics as geometric}
					<!-- <GeometricControlsCard {geometric} /> -->
				{/each}
			</div>
		</TabItem>
	</Tabs>
</div>
