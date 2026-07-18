import { BadRequestException } from '@nestjs/common';

interface ActiveReferenceTarget {
  isActive?: boolean;
  name?: string;
  label?: string;
}

interface FindableRepo<T> {
  findOneBy(where: Record<string, any>): Promise<T | null>;
}

/**
 * Enforces the inactive-reference rule at the API write path:
 *
 * - a NEW record cannot reference inactive master data;
 * - an UPDATE cannot change a relationship to an inactive item;
 * - an existing record may retain its currently-assigned inactive item
 *   (pass `currentId`; an unchanged id is allowed through).
 *
 * `id` being null/undefined means the relationship is not being set — no check.
 * Throws 400 with the record's display name so the client can show a precise
 * message.
 */
export async function assertActiveReference<T extends ActiveReferenceTarget>(
  repo: FindableRepo<T>,
  id: number | null | undefined,
  entityLabel: string,
  currentId?: number | null,
): Promise<void> {
  if (id === null || id === undefined) return;
  if (currentId !== null && currentId !== undefined && id === currentId) return;

  const target = await repo.findOneBy({ id });
  if (!target) {
    throw new BadRequestException(`${entityLabel} with id ${id} does not exist.`);
  }
  if (target.isActive === false) {
    const displayName = target.name ?? target.label ?? `#${id}`;
    throw new BadRequestException(
      `${entityLabel} "${displayName}" is inactive and cannot be assigned.`,
    );
  }
}
