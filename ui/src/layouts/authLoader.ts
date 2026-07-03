import { redirect } from 'react-router-dom';
import { getAPIURL } from '@/utils/api';

let bootstrapPromise: Promise<{ access_token: string } | null> | null = null;

function bootstrapAuth(): Promise<{ access_token: string } | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetch(`${getAPIURL()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => (res.ok ? (res.json() as Promise<{ access_token: string }>) : null))
      .catch(() => null);
  }
  return bootstrapPromise;
}

export async function authLoader() {
  const session = await bootstrapAuth();
  if (!session) {
    throw redirect('/login');
  }
  return session;
}
