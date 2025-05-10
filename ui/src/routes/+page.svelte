<script lang="ts">
	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
	import IconButton, { Icon } from '@smui/icon-button';
	import { mdiInformation } from '@mdi/js';

	import LoginButton from '$lib/LoginButton.svelte';
</script>

<TopAppBar variant="static">
	<Row>
		<Section>
			<Title>Luxide</Title>
		</Section>
		<Section align="end" toolbar>
			<IconButton>
				<Icon tag="svg" viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiInformation} />
				</Icon>
			</IconButton>
			<LoginButton />
		</Section>
	</Row>
</TopAppBar>

<main class="main-content">
	<h1>Welcome to Luxide</h1>
	<p>A path tracer written in Rust</p>
</main>

<style>
	.main-content {
		margin: 1rem;
	}
</style>
