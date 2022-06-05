import { ApiRouteHandler, ApiRouteMiddleware } from '../api-middleware-typings';
import { PerRequestContext } from '../per-request-context';

export interface IChainingStrategy {
  wrapHandler(handler: ApiRouteHandler, context: PerRequestContext): ApiRouteMiddleware;

  wrapMiddleware(handler: ApiRouteMiddleware, context: PerRequestContext): ApiRouteMiddleware;
}

