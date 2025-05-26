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

<div class="flex flex-col gap-4">
	<Tabs
		tabStyle="pill"
		ulClass="justify-center"
		contentClass="!bg-zinc-900 border-t-[1px] border-zinc-600 rounded-none mt-0"
	>
		<TabItem open title="Parameters">
			<div class="flex flex-col items-center gap-4">
				<ParametersControlsCard parameters={renderConfig.parameters} />
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

	<Label class="flex flex-col gap-2">
		<Range
			bind:value={renderConfig.parameters.image_dimensions[0]}
			min={100}
			max={5000}
			step={10}
		/>
		<span>Width = {renderConfig.parameters.image_dimensions[0]}</span>
	</Label>

	<Label class="flex flex-col gap-2">
		<Range
			bind:value={renderConfig.parameters.image_dimensions[1]}
			min={100}
			max={5000}
			step={10}
		/>
		<span>Height = {renderConfig.parameters.image_dimensions[1]}</span>
	</Label>
	<Label class="flex flex-col gap-2">
		<Range
			bind:value={camera.target_location[0]}
			min={0.0}
			max={1.0}
			step={0.01}
		/>
		<span>Camera Target: X = {camera.target_location[0]}</span>
	</Label>
	<Label class="flex flex-col gap-2">
		<Range
			bind:value={camera.target_location[1]}
			min={0.0}
			max={1.0}
			step={0.01}
		/>
		<span>Camera Target: Y = {camera.target_location[1]}</span>
	</Label>
	<Label class="flex flex-col gap-2">
		<Range
			bind:value={camera.target_location[2]}
			min={0.0}
			max={1.0}
			step={0.01}
		/>
		<span>Camera Target: Z = {camera.target_location[2]}</span>
	</Label>
</div>
