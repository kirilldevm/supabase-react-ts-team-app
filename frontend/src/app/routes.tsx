import { PAGES } from '@/configs/pages.config';
import { Navigate, Outlet, type RouteObject } from 'react-router';
import GuestLayout from './layouts/guest-layout';
import ProtectedLayout from './layouts/protected-layout';
import AppHome from './routes/app-home';
import AuthCallback from './routes/auth.callback';
import AuthConfirm from './routes/auth.confirm';
import AuthError from './routes/auth.error';
import { CreateProduct } from './routes/create-product';
import ForgotPassword from './routes/forgot-password';
import ProductDetail from './routes/product-detail';
import Login from './routes/login';
import Logout from './routes/logout';
import OnboardingPage from './routes/onboarding';
import SignUp from './routes/sign-up';
import UpdatePassword from './routes/update-password';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Navigate to={PAGES.APP.HOME} replace />,
      },
      {
        path: 'login/register',
        element: <Navigate to={PAGES.AUTH.SIGN_UP} replace />,
      },
      {
        path: 'register',
        element: <Navigate to={PAGES.AUTH.SIGN_UP} replace />,
      },
      {
        element: <GuestLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'sign-up',
            element: <SignUp />,
          },
          {
            path: 'forgot-password',
            element: <ForgotPassword />,
          },
          {
            path: 'update-password',
            element: <UpdatePassword />,
          },
        ],
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: 'app',
            element: <AppHome />,
            children: [
              {
                path: 'create-product',
                element: <CreateProduct />,
              },
            ],
          },
          {
            path: 'app/products/:id',
            element: <ProductDetail />,
          },
          {
            path: 'onboarding',
            element: <OnboardingPage />,
          },
        ],
      },
      {
        path: 'protected',
        element: <Navigate to={PAGES.APP.HOME} replace />,
      },
      {
        path: 'logout',
        element: <Logout />,
      },
      {
        path: 'auth/callback',
        element: <AuthCallback />,
      },
      {
        path: 'auth/confirm',
        element: <AuthConfirm />,
      },
      {
        path: 'auth/error',
        element: <AuthError />,
      },
    ],
  },
];

export default routes;
