import { IChainingStrategy } from './i-chaining-strategy';
import { ApiRouteHandler, ApiRouteMiddleware, FuncReturnsPromise } from '../api-middleware-typings';
import { PerRequestContext } from '../per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';

export class StopAtFirstError implements IChainingStrategy {

  applyToHandler(handler: ApiRouteHandler, context: PerRequestContext): ApiRouteMiddleware {
    return async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise): Promise<void> => {
      await handler(req, res, context);
      return next()
    }
  }

  applyToMiddleware(handler: ApiRouteMiddleware, context: PerRequestContext): ApiRouteMiddleware {
    return handler;
  }

}
