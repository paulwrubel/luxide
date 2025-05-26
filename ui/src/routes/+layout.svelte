<script lang="ts">
	import '../app.css';
	import { isAuthenticated } from '$lib/state/auth.svelte';
	import { Navbar, NavBrand } from 'flowbite-svelte';
	import LoginButton from './LoginButton.svelte';
	import UserInfo from './UserInfo.svelte';
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

<!-- for applying global styles -->
<main class="bg-zinc-50 dark:bg-zinc-950">
	<QueryClientProvider client={queryClient}>
		<!-- flex container for the entire app -->
		<div class="flex min-h-screen w-full flex-col">
			<!-- app bar -->
			<Navbar fluid class="flex h-16 items-center border-b border-zinc-800 bg-zinc-900">
				<NavBrand href="/">
					<span class="self-center whitespace-nowrap text-xl font-semibold text-white">
						Luxide
					</span>
				</NavBrand>
				{#if isAuthenticated()}
					<UserInfo />
				{:else}
					<LoginButton />
				{/if}
			</Navbar>

			<!-- main content -->
			{@render children()}
		</div>
		<SvelteQueryDevtools buttonPosition="bottom-right" />
	</QueryClientProvider>
</main>
