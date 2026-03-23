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
} as const;
