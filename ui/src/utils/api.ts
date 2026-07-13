import type { RawRenderConfig, NormalizedRenderConfig } from './render/config';

export function getAPIURL(): string {
  // in production, the UI and API are served from the same origin (Rust embeds both)
  //
  // in dev, Vite proxies /api -> localhost:8080 transparently
  //
  // no port replacement is needed in either case
  return `${window.location.origin}/api/v1`;
}

function appendUserID(url: string, targetUserID?: number): string {
  if (targetUserID === undefined) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}user_id=${targetUserID}`;
}

export type LoginResponse = {
  redirect_url: string;
};

export async function navigateToAPILogin() {
  const response = await fetch(`${getAPIURL()}/auth/login?origin=${window.location.origin}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to start login sequence: (${response.status}: ${body})`);
  }

  const body = (await response.json()) as LoginResponse;

  if (body.redirect_url) {
    window.location.href = body.redirect_url;
    return;
  }

  throw new Error('Expected redirect response from login endpoint');
}

export type Role = 'admin' | 'user';

export type ResourceType = 'texture_image';

export function formatResourceType(resourceType: ResourceType): string {
  switch (resourceType) {
    case 'texture_image':
      return 'Texture Image';
    default:
      return resourceType;
  }
}

export type User = {
  id: number;
  github_id: number;
  username: string;
  avatar_url: string;
  created_at: Date;
  updated_at: Date;
  role: Role;
  max_renders: number | null;
  max_checkpoints_per_render: number | null;
  max_render_pixel_count: number | null;
  max_resource_storage_bytes: number | null;
};

export type UsageResponse = {
  bytes: number;
};

export type ResourceMeta = {
  id: number;
  user_id: number;
  name: string;
  resource_type: ResourceType;
  mime_type: string;
  byte_size: number;
  created_at: string;
};

export async function fetchAuthTokenGitHub(code: string, state: string): Promise<string> {
  const response = await fetch(`${getAPIURL()}/auth/github/callback?code=${code}&state=${state}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to retrieve auth token: (${response.status}: ${body})`);
  }

  const tokenResponse = await response.json();

  if (!tokenResponse.access_token) {
    throw new Error('failed to retrieve auth token: invalid response');
  }

  return tokenResponse.access_token;
}

export async function fetchUserInfo(fetcher: typeof fetch): Promise<User> {
  const response = await fetcher(`${getAPIURL()}/auth/current_user_info`);

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
  fetcher: typeof fetch,
  renderConfig: NormalizedRenderConfig,
  targetUserID?: number,
): Promise<PostRenderResponse> {
  const response = await fetcher(appendUserID(`${getAPIURL()}/renders`, targetUserID), {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(renderConfig),
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
  config: RawRenderConfig;
};

export type RenderState =
  | RenderStateCreated
  | RenderStateRunning
  | RenderStateFinishedCheckpointIteration
  | RenderStatePausing
  | RenderStatePaused;

export type RenderStateCreated = 'created';

export function isRenderStateCreated(state: RenderState): state is RenderStateCreated {
  return state === 'created';
}

export type RenderStateRunning = {
  running: {
    checkpoint_iteration: number;
    progress_info: ProgressInfoPrecise;
  };
};

export function isRenderStateRunning(state: RenderState): state is RenderStateRunning {
  return typeof state === 'object' && 'running' in state;
}

export type RenderStateFinishedCheckpointIteration = {
  finished_checkpoint_iteration: number;
};

export function isRenderStateFinishedCheckpointIteration(
  state: RenderState,
): state is RenderStateFinishedCheckpointIteration {
  return typeof state === 'object' && 'finished_checkpoint_iteration' in state;
}

export type RenderStatePausing = {
  pausing: {
    checkpoint_iteration: number;
    progress_info: ProgressInfoPrecise;
  };
};

export function isRenderStatePausing(state: RenderState): state is RenderStatePausing {
  return typeof state === 'object' && 'pausing' in state;
}

export type RenderStatePaused = {
  paused: number;
};

export function isRenderStatePaused(state: RenderState): state is RenderStatePaused {
  return typeof state === 'object' && 'paused' in state;
}

export function stateKey(state: RenderState): string {
  return typeof state === 'string' ? state : Object.keys(state)[0];
}

export type RenderStateSnapshot = {
  render_id: number;
  state: RenderState;
  updated_at: Render['updated_at'];
};

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

export async function getAllRenders(
  fetcher: typeof fetch,
  targetUserID?: number,
): Promise<Render[]> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders?format=precise`, targetUserID),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get renders: (${response.status}: ${body})`);
  }

  return (await response.json()) as Render[];
}

export async function getRender(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<Render> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}?format=precise`, targetUserID),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get render: (${response.status}: ${body})`);
  }

  return (await response.json()) as Render;
}

export async function pauseRender(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/pause`, targetUserID),
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to pause render: (${response.status}: ${body})`);
  }
}

export async function resumeRender(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/resume`, targetUserID),
    {
      method: 'POST',
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to resume render: (${response.status}: ${body})`);
  }
}

export async function deleteRender(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(appendUserID(`${getAPIURL()}/renders/${renderID}`, targetUserID), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to delete render: (${response.status}: ${body})`);
  }
}

export async function updateRenderTotalCheckpoints(
  fetcher: typeof fetch,
  renderID: number,
  newTotalCheckpoints: number,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/parameters/total_checkpoints`, targetUserID),
    {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ new_total_checkpoints: newTotalCheckpoints }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to update render total checkpoints: (${response.status}: ${body})`);
  }
}

export async function updateRenderName(
  fetcher: typeof fetch,
  renderID: number,
  newName: string,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/name`, targetUserID),
    {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error updating render name: ${response.status} ${body}`);
  }
}

export type RenderCheckpointStats = {
  average_elapsed: Duration;
  min_elapsed: Duration;
  max_elapsed: Duration;
};

export type RenderStats = {
  image_dimensions: [number, number];
  samples_per_checkpoint: number;
  total_iterations: number;
  completed_iterations: number;
  pixel_samples_per_checkpoint: number;
  total_samples_taken: number;
  elapsed: Duration;
  estimated_remaining: Duration;
  estimated_total: Duration;
  checkpoint_stats: RenderCheckpointStats;
};

export async function getRenderStats(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<RenderStats> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/stats?format=precise`, targetUserID),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get render stats: (${response.status}: ${body})`);
  }

  return (await response.json()) as RenderStats;
}

export async function getLatestCheckpointImage(
  fetcher: typeof fetch,
  renderID: number,
  targetUserID?: number,
): Promise<Blob | null> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/renders/${renderID}/checkpoint/latest`, targetUserID),
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get latest checkpoint image: (${response.status}: ${body})`);
  }

  return await response.blob();
}

export async function getAllUsers(fetcher: typeof fetch): Promise<User[]> {
  const response = await fetcher(`${getAPIURL()}/users`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get all users: (${response.status}: ${body})`);
  }

  return (await response.json()) as User[];
}

export async function updateUserRole(
  fetcher: typeof fetch,
  userID: number,
  role: Role,
): Promise<User> {
  const response = await fetcher(`${getAPIURL()}/users/${userID}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to update user role: (${response.status}: ${body})`);
  }

  return (await response.json()) as User;
}

export async function updateUserQuotas(
  fetcher: typeof fetch,
  userID: number,
  maxRenders: number | null,
  maxCheckpointsPerRender: number | null,
  maxRenderPixelCount: number | null,
  maxResourceStorageBytes: number | null,
): Promise<User> {
  const response = await fetcher(`${getAPIURL()}/users/${userID}/quotas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_renders: maxRenders,
      max_checkpoints_per_render: maxCheckpointsPerRender,
      max_render_pixel_count: maxRenderPixelCount,
      max_resource_storage_bytes: maxResourceStorageBytes,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to update user quotas: (${response.status}: ${body})`);
  }

  return (await response.json()) as User;
}

export async function getRenderStorageUsage(fetcher: typeof fetch): Promise<UsageResponse> {
  const response = await fetcher(`${getAPIURL()}/renders/storage_usage`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get renders storage usage: (${response.status}: ${body})`);
  }

  return (await response.json()) as UsageResponse;
}

export async function getAllResourceMetadata(
  fetcher: typeof fetch,
  targetUserID?: number,
): Promise<ResourceMeta[]> {
  const response = await fetcher(appendUserID(`${getAPIURL()}/resources`, targetUserID));

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get resources: (${response.status}: ${body})`);
  }

  return (await response.json()) as ResourceMeta[];
}

export async function createResource(
  fetcher: typeof fetch,
  formData: FormData,
  targetUserID?: number,
): Promise<ResourceMeta> {
  const response = await fetcher(appendUserID(`${getAPIURL()}/resources`, targetUserID), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok || response.status !== 201) {
    const body = await response.text();
    let message = body;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // body is not JSON, use raw text
    }
    throw new Error(message);
  }

  return (await response.json()) as ResourceMeta;
}

export async function deleteResource(
  fetcher: typeof fetch,
  resourceID: number,
  targetUserID?: number,
): Promise<void> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/resources/${resourceID}`, targetUserID),
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to delete resource: (${response.status}: ${body})`);
  }
}

export type ResourceStorageUsageResponse = {
  bytes: number;
};

export async function getResourceStorageUsage(
  fetcher: typeof fetch,
  targetUserID?: number,
): Promise<ResourceStorageUsageResponse> {
  const response = await fetcher(
    appendUserID(`${getAPIURL()}/resources/storage_usage`, targetUserID),
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`failed to get resource storage usage: (${response.status}: ${body})`);
  }

  return (await response.json()) as ResourceStorageUsageResponse;
}

/**
 * extract a human-readable error message from an API error.
 *
 * The backend returns structured JSON like `{"code": 403, "message": "..."}`
 * but the API client embeds it in a thrown Error: `"failed to ...: (403: {json})"`.
 * This function parses the JSON body out of the Error message and returns the
 * backend's `message` field. Falls back to the raw Error message if parsing fails.
 */
export function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }
  // try to extract the JSON body from the API client's error format:
  // "failed to ...: (STATUS: {json body})"
  const match = error.message.match(/\{.*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {
      // JSON parse failed — fall through to raw message
    }
  }
  return error.message;
}
