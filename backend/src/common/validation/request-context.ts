import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export interface RequestContext {
  method: string;
  path: string;
  userId?: number;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
}

const storage = new AsyncLocalStorage<{ req: Request }>();

/**
 * Makes the current request reachable from a ValidationPipe.
 *
 * Pipes receive only ArgumentMetadata — no request — so an observed validation
 * failure could otherwise report *what* failed but not *who* called or *which*
 * endpoint. Both are needed to decide whether a rule is safe to enforce.
 *
 * Nest runs middleware before guards, and guards before pipes, so req.user is
 * already populated by the JWT guard by the time the pipe reads this.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    storage.run({ req }, () => next());
  }
}

export function getRequestContext(): RequestContext | undefined {
  const store = storage.getStore();
  if (!store) return undefined;

  const req = store.req as Request & {
    user?: { id?: number; email?: string };
  };

  return {
    method: req.method,
    // route.path keeps the parameter placeholder (/assets/:id) so observations
    // aggregate per endpoint instead of exploding per id.
    path: (req.route?.path as string) ?? req.path ?? req.url,
    userId: req.user?.id,
    userEmail: req.user?.email,
    ip: req.ip,
    userAgent: req.get?.('user-agent') ?? undefined,
  };
}
