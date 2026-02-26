import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config (no DB/adapter). Used by middleware.
 * Full config with providers and callbacks is in auth.ts.
 */
export default {
  providers: [], // not used in middleware; full providers in auth.ts
  pages: {
    signIn: '/auth/signin',
  },
  trustHost: true,
  callbacks: {
    authorized: async ({ auth }) => !!auth,
  },
} satisfies NextAuthConfig;
