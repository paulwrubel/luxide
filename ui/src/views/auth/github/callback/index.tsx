import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { fetchAuthTokenGitHub } from '@/utils/api';
import { resetBootstrapCache } from '@/layouts/authLoader';
import { useAuth } from '@/providers/Auth';
import { Spinner } from 'flowbite-react';

/**
 * auth callback page that handles the OAuth flow
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  // component-level state
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // handle the oauth callback
    (async () => {
      try {
        // get code and state from URL params
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('missing code or state parameter');
        }

        // exchange code for token
        const accessToken = await fetchAuthTokenGitHub(code, state);
        // use auth state to handle token
        setAccessToken(accessToken);
        resetBootstrapCache();

        // redirect to stored page or home
        const redirect = sessionStorage.getItem('login_redirect');
        console.debug('[callback] login_redirect from sessionStorage:', redirect);
        sessionStorage.removeItem('login_redirect');

        // validate: must be a same-origin relative path (starts with single /, not // or https://)
        const safeRedirect = redirect && /^\/[^/]/.test(redirect) ? redirect : '/';
        console.debug('[callback] navigating to:', safeRedirect);
        navigate(safeRedirect, { replace: true });
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : 'authentication failed');
        setStatus('error');
      }
    })();
  }, [searchParams, navigate, setAccessToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'loading' && (
        <div className="text-center">
          <Spinner color="info" size="xl" className="mx-auto mb-4" />
          <p className="text-lg">Completing authentication...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center text-red-600">
          <p className="mb-4 text-lg">Authentication failed</p>
          <p className="text-sm">{errorMessage}</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
