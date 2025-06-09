import { browser } from '$app/environment';
import {
	getToken,
	getUser,
	initAuth,
	updateUserInfo
} from '$lib/state/auth.svelte';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
	if (browser) {
		await initAuth(fetch);

		const token = getToken();
		if (token && !getUser()) {
			await updateUserInfo(token);
		}
	}
};
