import { PAGES } from './pages.config';

/**
 * Routes that never require a session (marketing, auth UI, callbacks).
 */
export const publicRoutes = [PAGES.HOME, PAGES.AUTH.AUTH_CALLBACK];

/**
 * Auth-only screens: logged-in users are usually redirected away (see Login / SignUp).
 */
export const authRoutes = [
  PAGES.AUTH.LOGIN,
  PAGES.AUTH.SIGN_UP,
  PAGES.AUTH.FORGOT_PASSWORD,
  PAGES.AUTH.UPDATE_PASSWORD,
  PAGES.AUTH.AUTH_CALLBACK,
  PAGES.AUTH.AUTH_CONFIRM,
  PAGES.AUTH.AUTH_ERROR,
];

export const API_AUTH_PREFIX = '/api/auth';

/** After sign-in, router + `ProtectedLayout` send users here or to onboarding. */
export const DEFAULT_LOGIN_REDIRECT = PAGES.APP.HOME;
