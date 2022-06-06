import { ApiRouteHandler, ApiRouteMiddleware } from '../api-middleware-typings';

export interface IChainingStrategy {
  applyToHandler(handler: ApiRouteHandler): ApiRouteMiddleware;

  applyToMiddleware(handler: ApiRouteMiddleware): ApiRouteMiddleware;
}

