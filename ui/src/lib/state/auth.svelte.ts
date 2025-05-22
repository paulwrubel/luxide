import { goto } from '$app/navigation';
import { fetchUserInfo, type User } from '$lib/api';

// global auth state
const auth = $state({
	token: localStorage?.getItem('auth_token') ?? undefined
});

const user = $derived.by(() => {
	if (!auth.token) {
		return undefined;
	}

	return fetchUserInfo(auth.token).catch((e: Error) => {
		if (e.message === 'Unauthorized') {
			clearToken();
		}
		return undefined;
	});
});

export async function authenticatedUser(): Promise<User | undefined> {
	return user ? await user : undefined;
}

export function getToken(): string {
	if (!auth.token) {
		goto('/login');
		return '';
	}

	return auth.token;
}

// set token function to be called from components
export function setToken(newToken: string) {
	localStorage.setItem('auth_token', newToken);
	auth.token = newToken;
}

// clear token function to be called from components
export function clearToken() {
	localStorage.removeItem('auth_token');
	auth.token = undefined;
}

export function isAuthenticated() {
	return !!auth.token;
}
