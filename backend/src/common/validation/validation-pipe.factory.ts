import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { flattenValidationErrors } from './validation-error.util';
import {
  VALIDATION_FAILURE,
  ValidationFailurePayload,
} from './validation-exception.filter';
import { getObservedProperties, observedRulesAreEnforced } from './observe.decorator';
import { getRequestContext } from './request-context';
import {
  ObservedFailure,
  ValidationObservationService,
} from './validation-observation.service';

/**
 * Builds the structured payload the ValidationExceptionFilter consumes.
 * `message` keeps Nest's flat string[] shape for backward compatibility.
 */
export function buildValidationFailure(
  errors: ValidationError[],
): ValidationFailurePayload {
  const fieldErrors = flattenValidationErrors(errors);
  return {
    [VALIDATION_FAILURE]: true,
    message: Object.values(fieldErrors).flat(),
    errors: fieldErrors,
  };
}

/** Splits errors into those that are enforced and those merely observed. */
export function partitionObservedErrors(
  errors: ValidationError[],
  observedProperties: Record<string, string | undefined>,
): { enforced: ValidationError[]; observed: ValidationError[] } {
  const enforced: ValidationError[] = [];
  const observed: ValidationError[] = [];

  for (const error of errors) {
    if (error.property in observedProperties) observed.push(error);
    else enforced.push(error);
  }

  return { enforced, observed };
}

function toObservedFailures(errors: ValidationError[]): ObservedFailure[] {
  return errors.flatMap((error) =>
    Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
      field: error.property,
      constraint,
      message,
    })),
  );
}

/**
 * ValidationPipe with per-property observation mode.
 *
 * A rule marked @Observe is recorded and allowed through instead of rejecting;
 * every other rule rejects exactly as it always has. That distinction matters:
 * a global "enforce nothing" switch would also disable rules that work today,
 * so the release meant to be safe would be the one that admits bad data.
 *
 * Observation cannot be done in an exception filter — once the pipe throws,
 * the route handler is already skipped.
 */
@Injectable()
export class AppValidationPipe extends ValidationPipe {
  private readonly log = new Logger('Validation');

  constructor(
    private readonly observations: ValidationObservationService | undefined,
    options: ValidationPipeOptions,
  ) {
    super(options);
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    try {
      return await super.transform(value, metadata);
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;

      const observedProperties = getObservedProperties(metadata.metatype);
      if (!Object.keys(observedProperties).length) throw error;
      if (observedRulesAreEnforced()) throw error;

      const response = error.getResponse();
      if (
        typeof response !== 'object' ||
        response === null ||
        !(VALIDATION_FAILURE in response)
      ) {
        throw error;
      }

      const raw = (response as ValidationFailurePayload & {
        rawErrors?: ValidationError[];
      }).rawErrors;

      if (!raw?.length) throw error;

      const { enforced, observed } = partitionObservedErrors(
        raw,
        observedProperties,
      );

      if (observed.length) {
        // Fire-and-forget: recording must not delay or break the request.
        void this.observations
          ?.record(toObservedFailures(observed), getRequestContext())
          .catch((e) =>
            this.log.error(`Observation failed: ${(e as Error).message}`),
          );
      }

      // Any non-observed failure still rejects, carrying only the enforced
      // errors — an observed rule must never leak into the user's error list.
      if (enforced.length) {
        throw new BadRequestException(buildValidationFailure(enforced));
      }

      return value;
    }
  }
}

/**
 * The single source of ValidationPipe configuration.
 *
 * Both the bootstrap in main.ts and the e2e test apps build their pipe here so
 * the two cannot drift (main.ts previously carried a comment pointing at a
 * `test/utils/create-test-app.ts` that does not exist).
 */
export function createValidationPipe(
  observations?: ValidationObservationService,
  overrides: ValidationPipeOptions = {},
): ValidationPipe {
  return new AppValidationPipe(observations, {
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) => {
      const payload = buildValidationFailure(errors);
      // Carry the structured errors so the pipe can partition them by property
      // without re-parsing the flattened messages.
      return new BadRequestException({ ...payload, rawErrors: errors });
    },
    ...overrides,
  });
}
