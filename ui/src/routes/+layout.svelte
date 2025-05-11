<script lang="ts">
	import { auth } from '$lib/state/auth.svelte';
	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
	import LoginButton from '$lib/LoginButton.svelte';
	import UserInfo from '$lib/UserInfo.svelte';

	let { children } = $props();
</script>

<TopAppBar variant="static">
	<Row>
		<Section>
			<Title>Luxide</Title>
		</Section>
		<Section align="end" toolbar>
			{#if auth.token}
				<UserInfo />
			{:else}
				<LoginButton />
			{/if}
		</Section>
	</Row>
</TopAppBar>

{@render children()}
