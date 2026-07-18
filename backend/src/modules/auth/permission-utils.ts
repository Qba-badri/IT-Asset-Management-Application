import { User } from '../../entities/user.entity';

/**
 * The single definition of which permission slugs a user effectively holds.
 *
 * Authorization requires the whole chain to be active: the user (checked by
 * the callers before this), the role, and each individual permission. An
 * inactive role or permission stays assigned in the database — mappings are
 * preserved for reactivation — but contributes nothing here.
 *
 * Used by JwtStrategy.validate (per request, so deactivating a role or
 * permission takes effect immediately) and by the login response, so the two
 * paths cannot drift.
 */
export function effectivePermissions(user: User): string[] {
  const role = user.role;
  if (!role || role.isActive === false) return [];
  return (role.permissions ?? [])
    .filter((p) => p.isActive !== false)
    .map((p) => p.slug);
}
