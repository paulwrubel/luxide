import { Outlet } from 'react-router-dom';
import {} from 'flowbite-react';
import { LayoutNavbar } from './LayoutNavbar';

/**
 * root layout shell with nav bar and <Outlet /> content area.
 * handles three auth states: unauthenticated (log in button),
 * loading (spinner), and authenticated (avatar dropdown with log out).
 */
export function Layout() {
  return (
    <div className="flex h-screen flex-col">
      <LayoutNavbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-200">
        <Outlet />
      </main>
    </div>
  );
}
