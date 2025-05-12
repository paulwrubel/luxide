<script lang="ts">
	import Drawer, { AppContent, Content } from '@smui/drawer';
	import { Canvas, T } from '@threlte/core';
	import Scene from './Scene.svelte';
</script>

<div class="content-container">
	<div class="drawer-container">
		<Drawer>
			<Content>
				<p>Hiya from /renders/new!</p>
			</Content>
		</Drawer>
	</div>
	<div class="main-content">
		<AppContent class="app-content">
			<div class="canvas-wrapper">
				<Canvas>
					<Scene />
				</Canvas>
			</div>
		</AppContent>
	</div>
</div>

<style>
	.content-container {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.drawer-container {
		height: 100%;
		min-width: 0;
	}

	.main-content {
		flex: 1;
		padding: 1rem;
		display: flex;
		min-width: 0;
		overflow: hidden;
	}

	:global(.app-content) {
		flex: 1;
		border: 1px solid var(--mdc-theme-surface-variant, #e7e0ec);
		display: flex;
		min-width: 0;
		overflow: hidden;
	}

	.canvas-wrapper {
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
	}

	/* ensure canvas takes up full container space */
	:global(.canvas-wrapper > div) {
		width: 100%;
		height: 100%;
	}
</style>
