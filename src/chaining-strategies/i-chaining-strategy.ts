import { ApiRouteHandler, ApiRouteMiddleware } from '../api-middleware-typings';
import { PerRequestContext } from '../per-request-context';

export interface IChainingStrategy {
  applyToHandler(handler: ApiRouteHandler, context: PerRequestContext): ApiRouteMiddleware;

  applyToMiddleware(handler: ApiRouteMiddleware, context: PerRequestContext): ApiRouteMiddleware;
}

