import { ThemeProvider } from 'flowbite-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/Auth';
import { AdminUserOverrideProvider } from '@/providers/AdminUserOverride';
import { LuxideToaster } from '@/components/LuxideToaster';
import { Outlet } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers() {
  return (
    <ThemeProvider>
      <LuxideToaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdminUserOverrideProvider>
            <Outlet />
          </AdminUserOverrideProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
