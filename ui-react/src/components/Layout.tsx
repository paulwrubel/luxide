import { Outlet, Link } from 'react-router-dom';
import { Button, Avatar, Dropdown, DropdownItem, Spinner } from 'flowbite-react';
import { useAuth } from '../utils/auth';
import { navigateToAPILogin } from '../utils/api';

export default function Layout() {
  const { isAuthenticated, user, clearToken } = useAuth();

  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <div className="flex h-full w-full flex-col">
        {/* App bar */}
        <nav className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
          <Link to="/" className="self-center text-xl font-semibold whitespace-nowrap text-white">
            Luxide
          </Link>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                {user === undefined ? (
                  <div className="flex items-center gap-2">
                    <Spinner color="info" size="sm" />
                    <span className="text-sm text-white">Loading...</span>
                  </div>
                ) : (
                  <Dropdown
                    label={
                      <div className="flex items-center gap-2">
                        <Avatar img={user.avatar_url} alt="User avatar" size="sm" />
                        <span className="text-sm font-medium">{user.username}</span>
                      </div>
                    }
                    arrowIcon={false}
                    inline
                  >
                    <DropdownItem onClick={handleLogout}>Log Out</DropdownItem>
                  </Dropdown>
                )}
              </div>
            ) : (
              <Button color="default" onClick={navigateToAPILogin}>
                Log In
              </Button>
            )}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
