<script lang="ts">
	import {
		getCameraData,
		getSceneData,
		type RenderConfig
	} from '$lib/utils/render';
	import CameraControlsCard from './CameraControlsCard.svelte';
	import GeometricControlsCard from './GeometricControlsCard.svelte';
	import { Label, Range, TabItem, Tabs } from 'flowbite-svelte';
	import ParametersControlsCard from './ParametersControlsCard.svelte';

	type Props = {
		renderConfig: RenderConfig;
	};

	const { renderConfig }: Props = $props();

	const activeScene = $derived(
		getSceneData(renderConfig, renderConfig.active_scene)
	);
	const camera = $derived(getCameraData(renderConfig, activeScene.camera));
</script>

<div class="flex flex-col">
	<Tabs
		tabStyle="pill"
		ulClass="justify-center mb-4"
		contentClass="!bg-zinc-900 border-t-[1px] border-zinc-600 rounded-none mt-0"
	>
		<TabItem open title="Parameters">
			<div class="flex flex-col items-center gap-4">
				<ParametersControlsCard />
			</div>
		</TabItem>
		<TabItem title="Camera">
			<div class="flex flex-col items-center gap-4">
				<CameraControlsCard {camera} />
			</div>
		</TabItem>
		<TabItem title="Geometrics">
			<div class="flex flex-col items-center gap-4">
				{#each activeScene.geometrics as geometric}
					<GeometricControlsCard {geometric} />
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
