import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { FieldErrorMap, ValidationErrorBody } from './validation-error.util';

/**
 * Marker attached by the validation pipe's exceptionFactory so this filter can
 * tell a validation 400 apart from a hand-thrown BadRequestException.
 */
export const VALIDATION_FAILURE = '__validationFailure';

export interface ValidationFailurePayload {
  [VALIDATION_FAILURE]: true;
  message: string[];
  errors: FieldErrorMap;
}

function isValidationFailure(
  response: unknown,
): response is ValidationFailurePayload {
  return (
    typeof response === 'object' &&
    response !== null &&
    VALIDATION_FAILURE in response
  );
}

/**
 * Reshapes validation 400s into a field-addressable body and logs them.
 *
 * Non-validation BadRequestExceptions are re-emitted untouched, so hand-thrown
 * business errors keep their existing shape.
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Validation');

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse = exception.getResponse();

    if (!isValidationFailure(exceptionResponse)) {
      // Not a validation failure — pass through unchanged.
      return response.status(exception.getStatus()).json(exceptionResponse);
    }

    const correlationId = randomUUID();
    const { message, errors } = exceptionResponse;

    this.logger.warn(
      JSON.stringify({
        correlationId,
        method: request.method,
        path: request.url,
        userId: (request as any).user?.id ?? null,
        fields: Object.keys(errors),
        errors,
      }),
    );

    const body: ValidationErrorBody = {
      statusCode: 400,
      error: 'Bad Request',
      message,
      errors,
      correlationId,
    };

    return response.status(400).json(body);
  }
}
