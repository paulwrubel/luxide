<script lang="ts">
	import { isAuthenticated } from '$lib/state/auth.svelte';
	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
	import LoginButton from '$lib/LoginButton.svelte';
	import UserInfo from '$lib/UserInfo.svelte';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { browser } from '$app/environment';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<div class="app-container">
		<TopAppBar variant="static">
			<Row>
				<Section>
					<Title>Luxide</Title>
				</Section>
				<Section align="end" toolbar>
					{#if isAuthenticated()}
						<UserInfo />
					{:else}
						<LoginButton />
					{/if}
				</Section>
			</Row>
		</TopAppBar>

		<div class="content-container">
			{@render children()}
		</div>
	</div>
	<SvelteQueryDevtools />
</QueryClientProvider>

<style>
	/* container for the entire app */
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100%;
		overflow: hidden;
	}

	/* container for the main content below the app bar */
	.content-container {
		flex: 1;
		overflow: auto;
		display: flex;
		min-width: 0; /* prevent flex items from overflowing */
	}
</style>
