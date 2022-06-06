import { ApiRouteMethods, ApiRouteMiddleware, FuncReturnsPromise, HandlerOptions, RouteDefinitions } from './api-middleware-typings';
import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';
import { IChainingStrategy } from './chaining-strategies/i-chaining-strategy';
import { ChainingStrategies } from './chaining-strategies';
import { createdOneTimeCallable } from './utils';


function defaultRouteMissingMessage() {
  return {message: 'not found'};
}

function defaultErrorHandler(error: unknown) {
  throw  error;
}


function createChainRunner(definition: RouteDefinitions, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, chainingStrategy: IChainingStrategy): FuncReturnsPromise {

  const {handler, preHooks = [], postHooks = []} = definition;

  const wrappedPreHooks: ApiRouteMiddleware[] = preHooks.map(x => chainingStrategy.applyToMiddleware(x));
  const wrappedHandler: ApiRouteMiddleware = chainingStrategy.applyToHandler(handler);
  const wrappedPostHooks: ApiRouteMiddleware[] = postHooks.map(x => chainingStrategy.applyToMiddleware(x));
  const reversedMiddlewares: ApiRouteMiddleware[] = [...wrappedPreHooks, wrappedHandler, ...wrappedPostHooks].reverse();

  const chain = reversedMiddlewares.reduce((acc: FuncReturnsPromise, middleware: ApiRouteMiddleware) => {
    return (() => middleware(req, res, context, createdOneTimeCallable(acc, 'next was called more than once')));
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

    const context = new PerRequestContext();

    try {
      const chainRunner = createChainRunner(definition, req, res, context, chainingStrategy);
      await chainRunner()
    } catch (e) {
      await errorHandler(e, req, res, context);
    } finally {
      await context.destroy()
    }
  }
}
