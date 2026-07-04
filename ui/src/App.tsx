import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Providers } from './layouts/Providers';
import { Layout } from './layouts/Layout';
import { authLoader } from './layouts/authLoader';
import { AuthenticatedRouteLayout } from './layouts/AuthenticatedRouteLayout';
import { HomePage } from './views';
import { LoginPage } from './views/login';
import { AuthCallbackPage } from './views/auth/github/callback';
import { RendersPage } from './views/renders';
import { RenderDetailPage } from './views/renders/[id]';
import { NewRenderPage } from './views/renders/new';
import { AdminRouteLayout } from './layouts/AdminRouteLayout';
import { AdminPage } from './views/admin';

const router = createBrowserRouter([
  {
    element: <Providers />,
    children: [
      {
        element: <Layout />,
        children: [
          // public routes
          { path: '/', element: <HomePage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/auth/github/callback', element: <AuthCallbackPage /> },
          // authenticated routes — nested inside authenticated layout to redirect to /login if not logged in
          {
            element: <AuthenticatedRouteLayout />,
            loader: authLoader,
            children: [
              { path: '/renders', element: <RendersPage /> },
              { path: '/renders/:id', element: <RenderDetailPage /> },
              { path: '/renders/new', element: <NewRenderPage /> },
            ],
          },
          // admin routes — nested inside admin layout to redirect non-admins
          {
            element: <AdminRouteLayout />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
