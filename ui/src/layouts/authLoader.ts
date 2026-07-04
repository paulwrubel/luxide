import { redirect } from 'react-router-dom';
import { getAPIURL } from '@/utils/api';

export type AuthSession = {
  accessToken: string;
};

/**
 * route loader for the authenticated layout route.
 *
 * runs before <AuthenticatedRouteLayout> renders. recovers the user's session
 * from the httpOnly refresh_token cookie by calling POST /api/v1/auth/refresh.
 * if the cookie is valid, the backend returns a fresh JWT. if not (expired,
 * revoked, or absent), the loader throws a redirect to /login — the router
 * handles this before any authenticated component renders, so there's no
 * redirect flash.
 *
 * the result is cached at module level so it runs once across all navigations
 * within the authenticated route tree.
 */

let bootstrapPromise: Promise<AuthSession | null> | null = null;

export function bootstrapAuth(): Promise<AuthSession | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetch(`${getAPIURL()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          return null;
        }
        // the /auth/refresh response shape is known: { access_token: string }
        return res.json() as Promise<{ access_token: string }>;
      })
      .then((data) => {
        if (!data) {
          return null;
        }
        return { accessToken: data.access_token };
      })
      .catch(() => null);
  }
  return bootstrapPromise;
}

export function resetBootstrapCache(): void {
  bootstrapPromise = null;
}

export async function authLoader({ request }: { request: Request }) {
  const session = await bootstrapAuth();
  if (!session) {
    const url = new URL(request.url);
    if (sessionStorage.getItem('skip_redirect') === 'true') {
      sessionStorage.removeItem('skip_redirect');
    } else {
      sessionStorage.setItem('login_redirect', url.pathname + url.search);
    }
    throw redirect('/login');
  }
  return session;
}
