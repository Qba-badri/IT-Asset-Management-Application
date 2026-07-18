import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationObservation } from '../../entities/validation-observation.entity';
import { RequestContext } from './request-context';

export interface ObservedFailure {
  field: string;
  constraint: string;
  message: string;
}

@Injectable()
export class ValidationObservationService {
  private readonly logger = new Logger('ValidationObservation');

  constructor(
    @InjectRepository(ValidationObservation)
    private readonly repository: Repository<ValidationObservation>,
  ) {}

  /**
   * Records rules that would have rejected this request.
   *
   * Always logs — logs are the durable record even if the DB write fails — and
   * additionally upserts a counter row so the rollout can be reviewed with a
   * query rather than by grepping. Persistence errors are swallowed:
   * observation must never break a request it exists to let through.
   */
  async record(
    failures: ObservedFailure[],
    context: RequestContext | undefined,
  ): Promise<void> {
    const method = context?.method ?? 'UNKNOWN';
    const path = context?.path ?? 'unknown';

    for (const failure of failures) {
      this.logger.warn(
        JSON.stringify({
          event: 'VALIDATION_OBSERVED',
          method,
          path,
          field: failure.field,
          constraint: failure.constraint,
          message: failure.message,
          userId: context?.userId ?? null,
          userEmail: context?.userEmail ?? null,
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        }),
      );
    }

    try {
      for (const failure of failures) {
        await this.upsert(method, path, failure, context);
      }
    } catch (error) {
      this.logger.error(
        `Failed to persist validation observation: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Atomic insert-or-increment.
   *
   * Written as raw SQL because the increment must read the stored value
   * (`occurrences + 1`), which TypeORM's orUpdate cannot express — it can only
   * assign the values being inserted. Concurrent callers hitting the same rule
   * must not race into duplicate rows or lost increments.
   */
  private async upsert(
    method: string,
    path: string,
    failure: ObservedFailure,
    context: RequestContext | undefined,
  ): Promise<void> {
    await this.repository.query(
      `INSERT INTO validation_observations
         (method, path, field, constraint_name, message, occurrences,
          last_user_id, last_user_email, last_ip, last_user_agent,
          first_seen_at, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (method, path, field, constraint_name)
       DO UPDATE SET
         occurrences     = validation_observations.occurrences + 1,
         message         = EXCLUDED.message,
         last_user_id    = EXCLUDED.last_user_id,
         last_user_email = EXCLUDED.last_user_email,
         last_ip         = EXCLUDED.last_ip,
         last_user_agent = EXCLUDED.last_user_agent,
         last_seen_at    = NOW()`,
      [
        method,
        path.slice(0, 255),
        failure.field.slice(0, 128),
        failure.constraint.slice(0, 64),
        failure.message,
        context?.userId ?? null,
        context?.userEmail?.slice(0, 255) ?? null,
        context?.ip?.slice(0, 64) ?? null,
        context?.userAgent?.slice(0, 512) ?? null,
      ],
    );
  }

  /** The rollout report: which rules would break whom, most frequent first. */
  async report(): Promise<ValidationObservation[]> {
    return this.repository.find({ order: { occurrences: 'DESC' } });
  }

  async clear(): Promise<void> {
    await this.repository.clear();
  }
}
