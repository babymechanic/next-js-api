import { IChainingStrategy } from './i-chaining-strategy';
import { ApiRouteHandler, ApiRouteMiddleware } from '../api-middleware-typings';
import { PerRequestContext } from '../per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';
import { FuncReturnsPromise } from '../api-handler-factory';

export class StopAtFirstError implements IChainingStrategy {

  wrapHandler(handler: ApiRouteHandler, context: PerRequestContext): ApiRouteMiddleware {
    return async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise): Promise<void> => {
      await handler(req, res, context);
      return next()
    }
  }

  wrapMiddleware(handler: ApiRouteMiddleware, context: PerRequestContext): ApiRouteMiddleware {
    return handler;
  }

}
