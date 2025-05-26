<script lang="ts">
	import {
		getCameraData,
		getGeometricData,
		type CameraData,
		type GeometricBox,
		type GeometricData,
		type GeometricInstanceRotate,
		type GeometricList,
		type GeometricParallelogram,
		type RenderConfig
	} from '$lib/render';
	import { Card, Heading, Input, Label, Range } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';

	type Props = {
		renderConfig: RenderConfig;
		camera: string | CameraData;
	};

	const { renderConfig, camera }: Props = $props();

	const cameraData = getCameraData(renderConfig, camera);

	let isExpanded = $state(true);
	function handleToggleExpandCard() {
		isExpanded = !isExpanded;
	}

	/*
                // camera types
                export type CameraData = {
                    vertical_field_of_view_degrees: number;
                    eye_location: [number, number, number];
                    target_location: [number, number, number];
                    view_up: [number, number, number];
                    defocus_angle_degrees: number;
                    focus_distance: 'eye_to_target' | number;
                };
*/
</script>

{#snippet separator()}
	<div class="border-b-[1px] border-zinc-600"></div>
{/snippet}

{#snippet separatorVertical()}
	<div class="border-r-[1px] border-zinc-600"></div>
{/snippet}

{#snippet controlsCamera(data: CameraData)}
	<Label class="mb-2 flex flex-col gap-1.5">
		<span class="flex justify-between">
			<span>Vertical FOV (degrees)</span>
			<span>{data.vertical_field_of_view_degrees}</span>
		</span>
		<Range bind:value={data.vertical_field_of_view_degrees} min={10.0} max={170.0} step={1.0} />
	</Label>
	<div class="flex items-center gap-2">
		<Heading tag="h6" class="flex-1 whitespace-nowrap">Eye:</Heading>
		<div class="flex items-center gap-2">
			<Label class="mb-2 flex flex-col">
				<span class="px-2">X</span>
				<Input type="number" bind:value={data.eye_location[0]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Y</span>
				<Input type="number" bind:value={data.eye_location[1]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Z</span>
				<Input type="number" bind:value={data.eye_location[2]} />
			</Label>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<Heading tag="h6" class="flex-1 whitespace-nowrap">Target:</Heading>
		<div class="flex items-center gap-2">
			<Label class="mb-2 flex flex-col">
				<span class="px-2">X</span>
				<Input type="number" bind:value={data.target_location[0]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Y</span>
				<Input type="number" bind:value={data.target_location[1]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Z</span>
				<Input type="number" bind:value={data.target_location[2]} />
			</Label>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<Heading tag="h6" class="flex-1 whitespace-nowrap">View Up:</Heading>
		<div class="flex items-center gap-2">
			<Label class="mb-2 flex flex-col">
				<span class="px-2">X</span>
				<Input type="number" bind:value={data.view_up[0]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Y</span>
				<Input type="number" bind:value={data.view_up[1]} />
			</Label>
			<Label class="mb-2 flex flex-col">
				<span class="px-2">Z</span>
				<Input type="number" bind:value={data.view_up[2]} />
			</Label>
		</div>
	</div>

	<!-- <Label class="mb-2 flex flex-col gap-1.5">
		<span class="flex justify-between">
			<span>Defocus Angle (degrees)</span>
			<span>{data.defocus_angle_degrees}</span>
		</span>
		<Range bind:value={data.defocus_angle_degrees} min={0.0} max={170.0} step={1.0} />
	</Label>
	<Label class="mb-2 flex flex-col gap-1.5">
		<span class="flex justify-between">
			<span>Focus Distance</span>
			<span>{data.focus_distance}</span>
		</span>
		<Range bind:value={data.focus_distance} min={10.0} max={170.0} step={1.0} />
	</Label> -->
{/snippet}

<Card class="flex max-w-full flex-col !bg-zinc-800 !text-zinc-200">
	<button
		class="flex items-center justify-between p-4 pr-2"
		onclick={() => handleToggleExpandCard()}
	>
		{#if typeof camera === 'string'}
			<Heading tag="h2" class="text-xl font-bold">
				{camera}
			</Heading>
		{:else}
			<Heading tag="h2" class="text-xl font-light italic">inline</Heading>
		{/if}
		<div class="flex flex-row">
			{#if isExpanded}
				<ChevronUpOutline class="h-8 w-auto" />
			{:else}
				<ChevronDownOutline class="h-8 w-auto" />
			{/if}
		</div>
	</button>
	{#if isExpanded}
		<div transition:slide={{ duration: 300 }}>
			{@render separator()}
			<div class="flex flex-col gap-2 p-4">
				<!-- controls -->
				{@render controlsCamera(cameraData)}
			</div>
		</div>
	{/if}
</Card>
