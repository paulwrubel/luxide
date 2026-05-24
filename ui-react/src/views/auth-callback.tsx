import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { fetchAuthTokenGitHub } from '../utils/api';
import { useAuth } from '../utils/auth';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('missing code or state parameter');
        }

        const token = await fetchAuthTokenGitHub(code, state);
        setToken(token);

        const origin = localStorage.getItem('ui_origin');
        if (origin) {
          localStorage.removeItem('ui_origin');
          window.location.href = origin;
        } else {
          navigate('/', { replace: true });
        }
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : 'authentication failed'
        );
        setStatus('error');
      }
    }

    handleCallback();
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {status === 'loading' && (
        <div className="text-center">
          <div className="mb-4 mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-lg">Completing authentication...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center text-red-600">
          <p className="mb-4 text-lg">Authentication failed</p>
          <p className="text-sm">{errorMessage}</p>
          <Link
            to="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
