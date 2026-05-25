import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'flowbite-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/auth';
import { Layout } from './components/Layout';
import { AuthenticatedRouteLayout } from './components/AuthenticatedRouteLayout';
import { HomePage } from './views/home';
import LoginPage from './views/login';
import { AuthCallbackPage } from './views/auth-callback';
import RendersPage from './views/renders';
import RenderDetailPage from './views/render-detail';
import NewRenderPage from './views/render-new';

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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
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
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
