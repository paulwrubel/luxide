import { fetchUserInfo, type User } from '$lib/api';

// global auth state
export const auth = $state({
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
