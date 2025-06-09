import { browser } from '$app/environment';
import { fetchUserInfo, type User } from '$lib/utils/api';

// global auth state
let token = $state<string>();
let user = $state<User>();
let initialized = $state<boolean>(false);

export const auth = {
	get token() {
		return token;
	},
	get validToken() {
		if (!token) {
			throw new Error('Not authenticated');
		}
		return token;
	},
	get user() {
		return user;
	},
	get validUser() {
		if (!user) {
			throw new Error('Not authenticated');
		}
		return user;
	},
	get isAuthenticated() {
		return !!token;
	}
};

export async function initAuth(customFetch?: typeof window.fetch) {
	if (!initialized && browser && typeof window !== 'undefined') {
		token = localStorage?.getItem('auth_token') ?? undefined;
		initialized = true;
	}

	if (token && !user) {
		await updateUserInfo(token, customFetch);
	}
}

export async function updateUserInfo(
	token: string,
	customFetch?: typeof window.fetch
): Promise<User | undefined> {
	if (!token) {
		return undefined;
	}

	try {
		user = await fetchUserInfo(token, customFetch);
	} catch (e: unknown) {
		if (e instanceof Error && e.message === 'Unauthorized') {
			clearToken();
		}
		user = undefined;
	}

	return user;
}

export function getToken(): string | undefined {
	return token;
}

// set token function to be called from components
export function setToken(newToken: string) {
	localStorage?.setItem('auth_token', newToken);
	token = newToken;

	updateUserInfo(newToken);
}

// clear token function to be called from components
export function clearToken() {
	localStorage?.removeItem('auth_token');
	token = undefined;
	user = undefined;
}

export function getUser(): User | undefined {
	return user;
}
