<!-- auth callback page that handles the OAuth flow -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fetchAuthTokenGitHub } from '$lib/utils/api';
	import { setToken } from '$lib/state/auth.svelte';

	// component-level state with runes
	let { error, loading } = $state({
		error: null as string | null,
		loading: true
	});

	// handle the oauth callback
	async function handleCallback() {
		try {
			// get code and state from URL params
			const code = page.url.searchParams.get('code');
			const state = page.url.searchParams.get('state');

			if (!code || !state) {
				throw new Error('missing code or state parameter');
			}

			// exchange code for token
			const token = await fetchAuthTokenGitHub(code, state);

			// use auth state to handle token
			setToken(token);

			// get origin from localStorage
			const origin = localStorage.getItem('ui_origin');

			// redirect to home page
			if (origin) {
				// remove origin from localStorage
				localStorage.removeItem('ui_origin');
				window.location.href = origin;
			} else {
				goto('/');
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'authentication failed';
		} finally {
			loading = false;
		}
	}

	// run immediately
	handleCallback();
</script>

<div class="flex min-h-screen items-center justify-center">
	{#if loading}
		<div class="text-center">
			<div
				class="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"
			></div>
			<p class="text-lg">Completing authentication...</p>
		</div>
	{:else if error}
		<div class="text-center text-red-600">
			<p class="mb-4 text-lg">Authentication failed</p>
			<p class="text-sm">{error}</p>
			<a href="/" class="mt-4 inline-block text-blue-600 hover:underline"
				>Return to home</a
			>
		</div>
	{/if}
</div>
