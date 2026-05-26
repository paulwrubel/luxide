import { Outlet, Link } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  type NavbarTheme,
  NavbarCollapse,
  NavbarToggle,
  NavbarLink,
} from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';
import { UserBadge } from './UserBadge';

/**
 * root layout shell with nav bar and <Outlet /> content area.
 * handles three auth states: unauthenticated (log in button),
 * loading (spinner), and authenticated (avatar dropdown with log out).
 */
export function Layout() {
  const navbarTheme: DeepPartial<NavbarTheme> = {
    root: {
      base: 'bg-zinc-900 border-b border-zinc-800 px-4 h-16 dark:bg-zinc-900 dark:border-zinc-800',
      inner: {
        base: 'mx-auto flex h-full flex-wrap items-center justify-between',
      },
    },
  };

  return (
    <div className="flex h-screen flex-col">
      <Navbar fluid theme={navbarTheme}>
        <div className="flex items-baseline gap-4">
          {/* @ts-expect-error polymorphic 'as' prop not typed in flowbite-react */}
          <NavbarBrand as={Link} to="/">
            <span className="self-center text-xl font-semibold whitespace-nowrap text-white">
              Luxide
            </span>
          </NavbarBrand>
          <span className="cursor-default self-baseline text-sm text-zinc-500 select-none">
            {__APP_VERSION__}
          </span>
        </div>
        <div className="flex md:order-2">
          <UserBadge />
          <NavbarToggle />
        </div>
        <NavbarCollapse>
          {/* @ts-expect-error polymorphic 'as' prop not typed in flowbite-react */}
          <NavbarLink as={Link} to="/renders">
            Renders
          </NavbarLink>
        </NavbarCollapse>
      </Navbar>

      <main className="flex h-screen flex-col bg-zinc-950 text-zinc-200">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
