import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { getToken, initAuth } from '$lib/state/auth.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
	if (browser) {
		await initAuth(fetch);

		if (!getToken()) {
			goto('/login');
		}
	}
};
