import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'flowbite-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/Auth';
import { AdminUserOverrideProvider } from './providers/AdminUserOverride';
import { Layout } from './layouts/Layout';
import { AuthenticatedRouteLayout } from './layouts/AuthenticatedRouteLayout';
import { HomePage } from './views';
import { LoginPage } from './views/login';
import { AuthCallbackPage } from './views/auth/github/callback';
import { RendersPage } from './views/renders';
import { RenderDetailPage } from './views/renders/[id]';
import { NewRenderPage } from './views/renders/new';
import { AdminRouteLayout } from './layouts/AdminRouteLayout';
import { AdminPage } from './views/admin';
import { LuxideToaster } from './components/LuxideToaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <LuxideToaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AdminUserOverrideProvider>
              <Routes>
                <Route element={<Layout />}>
                  {/* public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/github/callback" element={<AuthCallbackPage />} />

                  {/* authenticated routes — nested inside authenticated layout to redirect to /login if not logged in */}
                  <Route element={<AuthenticatedRouteLayout />}>
                    <Route path="/renders" element={<RendersPage />} />
                    <Route path="/renders/:id" element={<RenderDetailPage />} />
                    <Route path="/renders/new" element={<NewRenderPage />} />
                  </Route>

                  {/* admin routes — nested inside admin layout to redirect non-admins */}
                  <Route element={<AdminRouteLayout />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
              </Routes>
            </AdminUserOverrideProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
