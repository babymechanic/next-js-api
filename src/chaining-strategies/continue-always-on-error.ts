import { ApiRouteHandler, ApiRouteMiddleware } from '../api-middleware-typings';
import { PerRequestContext } from '../per-request-context';
import { IChainingStrategy } from './i-chaining-strategy';
import { NextApiRequest, NextApiResponse } from 'next';
import { FuncReturnsPromise } from '../api-handler-factory';

export class ContinueAlwaysOnError implements IChainingStrategy {
  wrapHandler(handler: ApiRouteHandler, context: PerRequestContext): ApiRouteMiddleware {
    return async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise): Promise<void> => {
      try {
        await handler(req, res, context);
      } catch (e) {
        context.registerError(e);
        await next()
      }
    }
  }

  wrapMiddleware(handler: ApiRouteMiddleware, context: PerRequestContext): ApiRouteMiddleware {
    return async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise): Promise<void> => {
      try {
        await handler(req, res, context, next);
      } catch (e) {
        context.registerError(e);
        await next()
      }
    }
  }
}
