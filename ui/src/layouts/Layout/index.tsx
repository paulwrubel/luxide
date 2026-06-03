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
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-200">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--color-primary-500)_0%,transparent_60%)] opacity-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,var(--color-secondary-500)_0%,transparent_60%)] opacity-10" />
        </div>
        <div className="relative z-0 flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
