import { PAGES } from './pages.config';

/**
 * An Array of routes that are used for authentication
 * These routes don't require authentication
 * @type {string[]}
 */
export const publicRoutes = [PAGES.HOME, PAGES.AUTH.AUTH_CALLBACK];

/**
 * An Array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
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

/**
 * The prefix for API auth routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const API_AUTH_PREFIX = '/api/auth';

/**
 * The default route to redirect logged in users to
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = PAGES.PROTECTED.HOME;
