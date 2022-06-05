import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';
import { IChainingStrategy } from './chaining-strategies/i-chaining-strategy';

export type ApiRouteHandler = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<void>;
export type ApiRouteMiddleware = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>) => Promise<void>;

export type ApiRouteMethods = 'post' | 'get' | 'patch' | 'delete';

export type RouteDefinitions = {
  handler: ApiRouteHandler,
  preHooks?: ApiRouteMiddleware[],
  postHooks?: ApiRouteMiddleware[]
};

export type HandlerOptions = {
  handlerMissingResponse?: () => unknown;
  errorHandler?: (error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<void>;
  chainingStrategy?: IChainingStrategy;
}

