import { type RouteObject } from 'react-router'
import { Navigate, Outlet } from 'react-router'
import Login from './routes/login'
import SignUp from './routes/sign-up'
import ForgotPassword from './routes/forgot-password'
import UpdatePassword from './routes/update-password'
import Protected from './routes/protected'
import Logout from './routes/logout'
import AuthCallback from './routes/auth.callback'
import AuthConfirm from './routes/auth.confirm'
import AuthError from './routes/auth.error'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Navigate to="/protected" replace />,
      },
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
      {
        path: 'protected',
        element: <Protected />,
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
]

export default routes
