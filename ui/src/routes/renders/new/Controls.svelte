<script lang="ts">
	import Slider from '@smui/slider';
	import FormField from '@smui/form-field';
	import {
		getCameraData,
		getGeometricData,
		getSceneData,
		type GeometricData,
		type RenderConfig
	} from '$lib/render';
	import GeometricControlsCard from './GeometricControlsCard.svelte';
	import List, { Item, Separator } from '@smui/list';

	type Props = {
		renderConfig: RenderConfig;
	};

	const { renderConfig }: Props = $props();

	const activeScene = $derived(getSceneData(renderConfig, renderConfig.active_scene));
	const camera = $derived(getCameraData(renderConfig, activeScene.camera));
</script>

<div class="controls-container">
	{#each activeScene.geometrics as geometric}
		<GeometricControlsCard {renderConfig} {geometric} />
	{/each}
	<Separator />

	<FormField class="drawer-element">
		<Slider
			bind:value={renderConfig.parameters.image_dimensions[0]}
			min={100}
			max={5000}
			step={10}
		/>
		Width = {renderConfig.parameters.image_dimensions[0]}
	</FormField>
	<FormField class="drawer-element">
		<Slider
			bind:value={renderConfig.parameters.image_dimensions[1]}
			min={100}
			max={5000}
			step={10}
		/>
		Height = {renderConfig.parameters.image_dimensions[1]}
	</FormField>
	<FormField class="drawer-element">
		<Slider bind:value={camera.target_location[0]} min={0.0} max={1.0} step={0.01} />
		Camera Target: X = {camera.target_location[0]}
	</FormField>
	<FormField class="drawer-element">
		<Slider bind:value={camera.target_location[1]} min={0.0} max={1.0} step={0.01} />
		Camera Target: Y = {camera.target_location[1]}
	</FormField>
	<FormField class="drawer-element">
		<Slider bind:value={camera.target_location[2]} min={0.0} max={1.0} step={0.01} />
		Camera Target: Z = {camera.target_location[2]}
	</FormField>
	{#each activeScene.geometrics as geometric}
		{@const geometricData = getGeometricData(renderConfig, geometric)}

		{#if geometricData.type === 'rotate_y'}
			{#if 'degrees' in geometricData}
				<FormField class="drawer-element">
					<Slider bind:value={geometricData.degrees} min={0.0} max={360.0} step={1.0} />
					Degrees = {geometricData.degrees}
				</FormField>
			{/if}
		{/if}
	{/each}
</div>

<style>
	.controls-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
