export const PAGES = {
  HOME: '/',

  /** Logged-in app (requires team / finished onboarding) */
  APP: {
    HOME: '/app',
    CREATE_PRODUCT: '/app/create-product',
  },

  /** Create or join a team */
  ONBOARDING: '/onboarding',

  AUTH: {
    LOGIN: '/login',
    SIGN_UP: '/sign-up',
    FORGOT_PASSWORD: '/forgot-password',
    UPDATE_PASSWORD: '/update-password',
    LOGOUT: '/logout',
    AUTH_CALLBACK: '/auth/callback',
    AUTH_CONFIRM: '/auth/confirm',
    AUTH_ERROR: '/auth/error',
  },
} as const;
