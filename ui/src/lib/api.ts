function getBaseURL(): string {
	return window.location.origin;
}

function getAPIURL(): string {
	const baseURL = getBaseURL();
	// replace the port in the browser, if any, with the API port
	const baseAPIURL = baseURL.replace(/:\d{4}$/, ':8080');

	return `${baseAPIURL}/api/v1`;
}

export type LoginResponse = {
	redirect_url: string;
};

export async function navigateToAPILogin() {
	const response = await fetch(`${getAPIURL()}/auth/login?origin=${window.location.origin}`, {
		credentials: 'include'
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to start login sequence: (${response.status}: ${body})`);
	}

	const body = (await response.json()) as LoginResponse;

	console.log(body);
	if (body.redirect_url) {
		window.location.href = body.redirect_url;
		return;
	}

	throw new Error('Expected redirect response from login endpoint');
}

export type Role = 'admin' | 'user';

export type User = {
	id: number;
	github_id: number;
	username: string;
	avatar_url: string;
	created_at: Date;
	updated_at: Date;
	role: Role;
	max_renders?: number;
	max_checkpoints_per_render?: number;
	max_render_pixel_count?: number;
};

export async function fetchAuthTokenGitHub(code: string, state: string): Promise<string> {
	const response = await fetch(`${getAPIURL()}/auth/github/callback?code=${code}&state=${state}`, {
		credentials: 'include'
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to retrieve auth token: (${response.status}: ${body})`);
	}

	const tokenResponse = await response.json();

	if (!tokenResponse.token) {
		throw new Error('failed to retrieve auth token: invalid response');
	}

	return tokenResponse.token;
}

export async function fetchUserInfo(token: string): Promise<User> {
	const response = await fetch(`${getAPIURL()}/auth/current_user_info`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!response.ok) {
		throw new Error('failed to fetch user');
	}

	return (await response.json()) as User;
}
