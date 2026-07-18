import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A validation rule that *would* have rejected a request, recorded while the
 * rule is in observation mode (see @Observe).
 *
 * Rows are aggregated on (method, path, formKey, field, constraint) and
 * counted rather than appended per failure. A row-per-failure log would grow
 * without bound — an authenticated caller in a retry loop could inflate it
 * indefinitely — and the review question is "which rules would break whom, and
 * how often", which a counter answers directly.
 *
 * This table exists for the backfill rollout and can be dropped once every
 * observed rule has been promoted to enforced.
 */
@Entity('validation_observations')
@Index(
  'idx_validation_observation_unique',
  ['method', 'path', 'field', 'constraintName'],
  { unique: true },
)
export class ValidationObservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 255 })
  path: string;

  @Column({ name: 'form_key', length: 128, nullable: true })
  formKey: string | null;

  @Column({ length: 128 })
  field: string;

  /**
   * The class-validator constraint that failed, e.g. 'isNotEmpty'.
   * Column is `constraint_name`: `constraint` is a reserved SQL word.
   */
  @Column({ name: 'constraint_name', length: 64 })
  constraintName: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'int', default: 1 })
  occurrences: number;

  /**
   * Caller identity from the most recent occurrence. "Where available" — an
   * unauthenticated endpoint has no user, and a non-UI script may send no
   * user-agent. A null userId with a non-browser user-agent is the signal that
   * an automated consumer exists.
   */
  @Column({ name: 'last_user_id', type: 'int', nullable: true })
  lastUserId: number | null;

  @Column({ name: 'last_user_email', length: 255, nullable: true })
  lastUserEmail: string | null;

  @Column({ name: 'last_ip', length: 64, nullable: true })
  lastIp: string | null;

  @Column({ name: 'last_user_agent', length: 512, nullable: true })
  lastUserAgent: string | null;

  @CreateDateColumn({ name: 'first_seen_at' })
  firstSeenAt: Date;

  @UpdateDateColumn({ name: 'last_seen_at' })
  lastSeenAt: Date;
}
