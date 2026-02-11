/**
 * Subset of user data exposed in the session (cached on client).
 */
export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
}

/**
 * Full user profile for UI and API (forms, profile page, API responses).
 */
export interface User {
  id: string;
  /** Session/display name (may be derived from firstName + lastName or username). */
  name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;

  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  address?: string | null;
  age?: number | null;
  username?: string | null;
  region?: string | null;
  state?: string | null;
  timezone?: string | null;
}
