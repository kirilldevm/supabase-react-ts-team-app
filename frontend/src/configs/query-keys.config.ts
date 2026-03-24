/**
 * TanStack Query keys in one place (same idea as {@link PAGES}).
 * Hooks / sync code should import from here so keys stay consistent.
 */
export const QUERY_KEYS = {
  AUTH: {
    ALL: ['auth'] as const,
    USER: () => [...QUERY_KEYS.AUTH.ALL, 'user'] as const,
    SESSION: () => [...QUERY_KEYS.AUTH.ALL, 'session'] as const,
  },
  ONBOARDING: {
    ALL: ['onboarding'] as const,
    /** Scoped by user so switching accounts does not reuse the wrong cache. */
    STATUS: (userId: string) =>
      [...QUERY_KEYS.ONBOARDING.ALL, 'status', userId] as const,
  },
  TEAM: {
    ALL: ['team'] as const,
    /** Team info (name + invite code) for a given user. */
    INFO: (userId: string) => [...QUERY_KEYS.TEAM.ALL, 'info', userId] as const,
    /** All profiles in the team (member list). */
    MEMBERS: (teamId: string) =>
      [...QUERY_KEYS.TEAM.ALL, 'members', teamId] as const,
  },
  PRODUCTS: {
    ALL: ['products'] as const,
    /** Paginated + filtered list for a team. */
    LIST: (teamId: string) => [...QUERY_KEYS.PRODUCTS.ALL, 'list', teamId] as const,
    /** Single product detail. */
    DETAIL: (productId: string) =>
      [...QUERY_KEYS.PRODUCTS.ALL, 'detail', productId] as const,
  },
} as const;
