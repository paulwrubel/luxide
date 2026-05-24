import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './utils/auth';
import Layout from './components/Layout';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import HomePage from './views/home';
import LoginPage from './views/login';
import AuthCallbackPage from './views/auth-callback';
import RendersPage from './views/renders';
import RenderDetailPage from './views/render-detail';
import NewRenderPage from './views/new-render';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public layout: navbar + pages */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/auth/github/callback"
                element={<AuthCallbackPage />}
              />
            </Route>

            {/* Authenticated layout: renders pages with auth guard */}
            <Route element={<AuthenticatedLayout />}>
              <Route path="/renders" element={<RendersPage />} />
              <Route path="/renders/:id" element={<RenderDetailPage />} />
              <Route path="/renders/new" element={<NewRenderPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
