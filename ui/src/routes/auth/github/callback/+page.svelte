<!-- Auth callback page that handles the OAuth flow -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let error: string | null = null;
	let loading = true;

	onMount(async () => {
		try {
			// Get code and state from URL params
			const code = $page.url.searchParams.get('code');
			const state = $page.url.searchParams.get('state');

			if (!code || !state) {
				throw new Error('Missing code or state parameter');
			}

			// Exchange code for token
			const response = await fetch(`/api/v1/auth/github/callback?code=${code}&state=${state}`, {
				// credentials: 'include' // Important: send cookies
			});

			if (!response.ok) {
				throw new Error('Failed to authenticate');
			}

			const data = await response.json();

			// Store the token securely
			localStorage.setItem('auth_token', data.token);
			console.log('auth_token: ', data);

			// Redirect to home page or dashboard
			goto('/');
		} catch (e) {
			console.error('Auth error:', e);
			error = e instanceof Error ? e.message : 'Authentication failed';
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	{#if loading}
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
			<p class="text-lg">Completing authentication...</p>
		</div>
	{:else if error}
		<div class="text-center text-red-600">
			<p class="text-lg mb-4">Authentication failed</p>
			<p class="text-sm">{error}</p>
			<a href="/" class="mt-4 inline-block text-blue-600 hover:underline">Return to home</a>
		</div>
	{/if}
</div>
