import { useMemo } from 'react';

interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: number; name: string } | null;
  /** Permission slugs from the user's role, e.g. ['assets.view', 'users.manage'] */
  permissions: string[];
}

interface UseAuthReturn {
  user: StoredUser | null;
  roleName: string;
  permissions: string[];
  /**
   * Returns true if the user holds the given permission slug.
   * Mirrors the backend PermissionsGuard single-permission check.
   */
  hasPermission: (slug: string) => boolean;
  /**
   * Returns true if the user holds at least one of the given slugs.
   * Useful for showing a nav group when any child item is accessible.
   */
  hasAnyPermission: (slugs: string[]) => boolean;
  isAuthenticated: boolean;
}

/**
 * Single source of truth for auth state on the frontend.
 * Reads from localStorage so it is synchronous and flicker-free.
 * The stored object is written by Login.tsx after a successful login.
 */
export function useAuth(): UseAuthReturn {
  const user = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  }, []);

  const permissions = user?.permissions ?? [];
  const roleName = user?.role?.name ?? '';

  const hasPermission = (slug: string): boolean => permissions.includes(slug);

  const hasAnyPermission = (slugs: string[]): boolean =>
    slugs.some((slug) => permissions.includes(slug));

  return {
    user,
    roleName,
    permissions,
    hasPermission,
    hasAnyPermission,
    isAuthenticated: !!localStorage.getItem('token'),
  };
}
