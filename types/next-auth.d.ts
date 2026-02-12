import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      avatar?: string | null;
      companyId?: string | null;
      locationId?: string | null;
      teamId?: string | null;
      securityRoleId?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    avatar?: string | null;
    companyId?: string | null;
    locationId?: string | null;
    teamId?: string | null;
    securityRoleId?: string | null;
  }
}
