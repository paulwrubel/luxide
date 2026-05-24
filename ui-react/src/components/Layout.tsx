import { Outlet, Link } from 'react-router-dom';
import { Navbar, Button, Avatar, Dropdown, DropdownItem, Spinner } from 'flowbite-react';
import { useAuth } from '../utils/auth';
import { navigateToAPILogin } from '../utils/api';

export default function Layout() {
  const { isAuthenticated, user, validUser, clearToken } = useAuth();

  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="flex min-h-screen w-full flex-col">
        {/* App bar */}
        <Navbar
          fluid
          className="flex h-16 items-center border-b border-zinc-800 bg-zinc-900"
        >
          <Link to="/" className="self-center whitespace-nowrap text-xl font-semibold text-white">
            Luxide
          </Link>

          <div className="flex md:order-2">
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
                        <Avatar
                          img={validUser.avatar_url}
                          alt="User avatar"
                          size="sm"
                          rounded
                        />
                        <span className="text-sm font-medium text-white">
                          {validUser.username}
                        </span>
                      </div>
                    }
                    arrowIcon={false}
                    inline
                    className="z-10"
                  >
                    <DropdownItem
                      onClick={handleLogout}
                      className="!bg-primary-600 hover:!bg-primary-700 !text-white"
                    >
                      Log Out
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>
            ) : (
              <Button color="primary" onClick={navigateToAPILogin}>
                Log In
              </Button>
            )}
          </div>
        </Navbar>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
