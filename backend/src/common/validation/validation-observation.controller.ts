import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../modules/auth/guards/permissions.guard';
import { Permissions } from '../../modules/auth/decorators/permissions.decorator';
import { ValidationObservationService } from './validation-observation.service';
import { observedRulesAreEnforced } from './observe.decorator';

/**
 * The rollout report for observed validation rules.
 *
 * Admin-only: rows carry caller identity (user id, email, IP, user-agent),
 * which is not something every authenticated user should read.
 */
@Controller('validation/observations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ValidationObservationController {
  constructor(private readonly observations: ValidationObservationService) {}

  /**
   * Which observed rules would have rejected traffic, and from whom.
   *
   * Review this before promoting rules to enforced. `enforcing: false` means
   * observed rules are still letting requests through.
   */
  @Get()
  @Permissions('settings.manage')
  async report() {
    const observations = await this.observations.report();

    return {
      enforcing: observedRulesAreEnforced(),
      totalRules: observations.length,
      totalOccurrences: observations.reduce((sum, o) => sum + o.occurrences, 0),
      /**
       * Rules seen from a caller with no user id, or a non-browser user-agent,
       * are the ones most likely to belong to a script or integration — the
       * cases that make enforcement risky.
       */
      nonUiSuspects: observations.filter(
        (o) => o.lastUserId === null || !/Mozilla/i.test(o.lastUserAgent ?? ''),
      ).length,
      observations,
    };
  }

  @Delete()
  @Permissions('settings.manage')
  async clear() {
    await this.observations.clear();
    return { cleared: true };
  }
}
