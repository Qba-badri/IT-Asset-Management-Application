/**
 * Shared data-scope resolution used to decide how much data a user may see
 * across the dashboard, asset, and license list endpoints.
 *
 * Tiers are driven by permissions (never by role names):
 *  - 'global'     : holds 'dashboard.view.all'        → sees everything
 *  - 'department' : holds 'dashboard.view.department'  → own department only
 *  - 'self'       : neither                            → own records only
 *
 * A missing user (internal/report calls) is treated as global.
 */
export type ScopeLevel = 'global' | 'department' | 'self';

export interface DashboardScope {
  level: ScopeLevel;
  userId: number;
  departmentId: number | null;
}

export function resolveScope(user?: any): DashboardScope {
  if (!user) return { level: 'global', userId: 0, departmentId: null };
  const perms: string[] = user.permissions || [];
  const level: ScopeLevel = perms.includes('dashboard.view.all')
    ? 'global'
    : perms.includes('dashboard.view.department')
      ? 'department'
      : 'self';
  return {
    level,
    userId: user.id,
    departmentId: user.departmentId ?? null,
  };
}
