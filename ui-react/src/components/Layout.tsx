import { Outlet, Link } from 'react-router-dom';
import {
  Button,
  Avatar,
  Dropdown,
  DropdownItem,
  Spinner,
  Navbar,
  NavbarBrand,
} from 'flowbite-react';
import { useAuth } from '../providers/auth';
import { navigateToAPILogin } from '../utils/api';

const navbarTheme = {
  root: {
    base: 'bg-zinc-900 border-b border-zinc-800 px-4 h-16 dark:bg-zinc-900 dark:border-zinc-800',
    inner: {
      base: 'mx-auto flex h-full flex-wrap items-center justify-between',
    },
  },
};

/**
 * root layout shell with nav bar and <Outlet /> content area.
 * handles three auth states: unauthenticated (log in button),
 * loading (spinner), and authenticated (avatar dropdown with log out).
 */
export function Layout() {
  const { isAuthenticated, user, clearToken } = useAuth();

  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
      <Navbar fluid theme={navbarTheme}>
        {/* @ts-expect-error polymorphic 'as' prop not typed in flowbite-react */}
        <NavbarBrand as={Link} to="/">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-white">
            Luxide
          </span>
        </NavbarBrand>
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
      </Navbar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </main>
  );
}
