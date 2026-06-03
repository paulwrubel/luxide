import {
  NavbarBrand,
  NavbarToggle,
  Navbar,
  NavbarCollapse,
  NavbarLink,
  type NavbarTheme,
} from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';
import { UserBadge } from './UserBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/auth';

export function LayoutNavbar() {
  const { isAuthenticated } = useAuth();

  const navbarTheme: DeepPartial<NavbarTheme> = {
    root: {
      base: 'bg-zinc-900 border-b border-zinc-800 px-4 h-16 dark:bg-zinc-900 dark:border-zinc-800',
      inner: {
        base: 'mx-auto flex h-full flex-wrap items-center justify-between',
      },
    },
  };

  return (
    <Navbar fluid theme={navbarTheme}>
      <div className="flex flex-1 items-baseline gap-4">
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
      <div className="flex flex-1 justify-end md:order-2">
        <UserBadge />
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        {isAuthenticated && (
          // @ts-expect-error polymorphic 'as' prop not typed in flowbite-react
          <NavbarLink as={Link} to="/renders">
            Renders
          </NavbarLink>
        )}
      </NavbarCollapse>
    </Navbar>
  );
}
