import type { RenderConfig } from './render';

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
	const response = await fetch(
		`${getAPIURL()}/auth/login?origin=${window.location.origin}`,
		{
			credentials: 'include'
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`failed to start login sequence: (${response.status}: ${body})`
		);
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

export async function fetchAuthTokenGitHub(
	code: string,
	state: string
): Promise<string> {
	const response = await fetch(
		`${getAPIURL()}/auth/github/callback?code=${code}&state=${state}`,
		{
			credentials: 'include'
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`failed to retrieve auth token: (${response.status}: ${body})`
		);
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
		if (response.status === 401 || response.status === 404) {
			throw new Error('Unauthorized');
		}
		throw new Error('failed to fetch user');
	}

	return (await response.json()) as User;
}

export type PostRenderResponse = Render & {
	user_id: number;
};

export async function postRender(
	token: string,
	renderConfig: RenderConfig
): Promise<PostRenderResponse> {
	const response = await fetch(`${getAPIURL()}/renders`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		method: 'POST',
		body: JSON.stringify(renderConfig)
	});

	if (!response.ok || response.status !== 201) {
		const body = await response.text();
		throw new Error(`failed to create render: (${response.status}: ${body})`);
	}

	return (await response.json()) as PostRenderResponse;
}

export type Render = {
	id: number;
	state: RenderState;
	created_at: string;
	updated_at: string;
	config: RenderConfig;
};

export type RenderState =
	| RenderStateCreated
	| RenderStateRunning
	| RenderStateFinishedCheckpointIteration
	| RenderStatePausing
	| RenderStatePaused;

export type RenderStateCreated = 'created';

export function isRenderStateCreated(
	state: RenderState
): state is RenderStateCreated {
	return state === 'created';
}

export type RenderStateRunning = {
	running: {
		checkpoint_iteration: number;
		progress_info: ProgressInfoPrecise;
	};
};

export function isRenderStateRunning(
	state: RenderState
): state is RenderStateRunning {
	return typeof state === 'object' && 'running' in state;
}

export type RenderStateFinishedCheckpointIteration = {
	finished_checkpoint_iteration: number;
};

export function isRenderStateFinishedCheckpointIteration(
	state: RenderState
): state is RenderStateFinishedCheckpointIteration {
	return typeof state === 'object' && 'finished_checkpoint_iteration' in state;
}

export type RenderStatePausing = {
	pausing: {
		checkpoint_iteration: number;
		progress_info: ProgressInfoPrecise;
	};
};

export function isRenderStatePausing(
	state: RenderState
): state is RenderStatePausing {
	return typeof state === 'object' && 'pausing' in state;
}

export type RenderStatePaused = {
	paused: number;
};

export function isRenderStatePaused(
	state: RenderState
): state is RenderStatePaused {
	return typeof state === 'object' && 'paused' in state;
}

export type ProgressInfoPrecise = {
	progress: number;
	elapsed: Duration;
	estimated_remaining: Duration;
	estimated_total: Duration;
};

export type Duration = {
	secs: number;
	nanos: number;
};

export async function getAllRenders(token: string): Promise<Render[]> {
	const response = await fetch(`${getAPIURL()}/renders?format=precise`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to get renders: (${response.status}: ${body})`);
	}

	return (await response.json()) as Render[];
}

export async function getRender(
	token: string,
	renderID: number
): Promise<Render> {
	const response = await fetch(
		`${getAPIURL()}/renders/${renderID}?format=precise`,
		{
			headers: { Authorization: `Bearer ${token}` }
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to get render: (${response.status}: ${body})`);
	}

	return (await response.json()) as Render;
}

export async function pauseRender(
	token: string,
	renderID: number
): Promise<void> {
	const response = await fetch(`${getAPIURL()}/renders/${renderID}/pause`, {
		headers: { Authorization: `Bearer ${token}` },
		method: 'POST'
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to pause render: (${response.status}: ${body})`);
	}
}

export async function resumeRender(
	token: string,
	renderID: number
): Promise<void> {
	const response = await fetch(`${getAPIURL()}/renders/${renderID}/resume`, {
		headers: { Authorization: `Bearer ${token}` },
		method: 'POST'
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to resume render: (${response.status}: ${body})`);
	}
}

export async function deleteRender(
	token: string,
	renderID: number
): Promise<void> {
	const response = await fetch(`${getAPIURL()}/renders/${renderID}`, {
		headers: { Authorization: `Bearer ${token}` },
		method: 'DELETE'
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`failed to delete render: (${response.status}: ${body})`);
	}
}

export async function updateRenderTotalCheckpoints(
	token: string,
	renderID: number,
	newTotalCheckpoints: number
): Promise<void> {
	const response = await fetch(
		`${getAPIURL()}/renders/${renderID}/parameters/total_checkpoints`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			method: 'PUT',
			body: JSON.stringify({ new_total_checkpoints: newTotalCheckpoints })
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`failed to update render total checkpoints: (${response.status}: ${body})`
		);
	}
}

export async function getLatestCheckpointImage(
	token: string,
	renderID: number
): Promise<Blob> {
	const response = await fetch(
		`${getAPIURL()}/renders/${renderID}/checkpoint/earliest`,
		{
			headers: { Authorization: `Bearer ${token}` }
		}
	);

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`failed to get latest checkpoint image: (${response.status}: ${body})`
		);
	}

	return await response.blob();
}
