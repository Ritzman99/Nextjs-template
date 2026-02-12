'use client';

import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

export interface RequiresAdminFullAccessProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const defaultFallback = (
  <p style={{ color: 'var(--theme-default-600)', fontSize: '0.875rem', margin: 0 }}>
    Requires Admin Role Full Access
  </p>
);

/**
 * Wraps content that should only be visible to users with admin role.
 * When the user is not an admin, shows the fallback (default: "Requires Admin Role Full Access").
 */
export function RequiresAdminFullAccess({ children, fallback = defaultFallback }: RequiresAdminFullAccessProps) {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

  if (status === 'loading') {
    return null;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
