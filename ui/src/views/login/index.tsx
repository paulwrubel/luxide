import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/Auth';
import { navigateToAPILogin } from '@/utils/api';
import { Button } from 'flowbite-react';
import { FaGithub } from 'react-icons/fa';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  if (isAuthenticated) {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
    return <Navigate to="/" replace />;
  }

  function handleLogin() {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      sessionStorage.setItem('login_redirect', redirect);
    }
    navigateToAPILogin().catch(console.error);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Button color="default" onClick={handleLogin}>
        <FaGithub className="mr-2 h-5 w-5" />
        Sign in with GitHub
      </Button>
    </div>
  );
}
