import { ApiRouteHandler, ApiRouteMethods, ApiRouteMiddleware, HandlerOptions, RouteDefinitions } from './api-middleware-typings';
import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';
import { StopAtFirstError } from './chaining-strategies/stop-at-first-error';
import { IChainingStrategy } from './chaining-strategies/i-chaining-strategy';
import { ChainingStrategies } from './chaining-strategies';

export type FuncReturnsPromise = () => Promise<void>;

function defaultRouteMissingMessage() {
  return {message: 'not found'};
}

function defaultErrorHandler(error: unknown) {
  throw  error;
}

function createChainRunner(preHooks: ApiRouteMiddleware[], handler: ApiRouteHandler, postHooks: ApiRouteMiddleware[], req: NextApiRequest,
                           res: NextApiResponse, context: PerRequestContext, chainingStrategy: IChainingStrategy): FuncReturnsPromise {

  const wrappedPreHooks: ApiRouteMiddleware[] = preHooks.map(x => chainingStrategy.wrapMiddleware(x, context));
  const wrappedHandler: ApiRouteMiddleware = chainingStrategy.wrapHandler(handler, context);
  const wrappedPostHooks: ApiRouteMiddleware[] = postHooks.map(x => chainingStrategy.wrapMiddleware(x, context));
  const reversedMiddlewares: ApiRouteMiddleware[] = [...wrappedPreHooks, wrappedHandler, ...wrappedPostHooks].reverse();

  const chain = reversedMiddlewares.reduce((acc: FuncReturnsPromise, middleware: ApiRouteMiddleware) => {
    return (() => middleware(req, res, context, acc))
  }, (() => Promise.resolve()));
  return chain ?? (() => Promise.resolve());
}

export function createHandlers(definitions: Partial<Record<ApiRouteMethods, RouteDefinitions>>, opts: HandlerOptions = {}): (req: NextApiRequest, res: NextApiResponse) => (void) {

  const {
    handlerMissingResponse = defaultRouteMissingMessage,
    errorHandler = defaultErrorHandler,
    chainingStrategy = ChainingStrategies.StopAtFirstError
  } = opts;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const definition = definitions[req.method?.toLowerCase() as ApiRouteMethods];
    if (definition == null) return res.status(404).json(handlerMissingResponse());
    const {handler, preHooks = [], postHooks = []} = definition;
    const context = new PerRequestContext();
    try {
      const chainRunner = createChainRunner(preHooks, handler, postHooks, req, res, context, chainingStrategy);
      await chainRunner()
    } catch (e) {
      await errorHandler(e, req, res, context);
    } finally {
      await context.destroy()
    }
  }
}
