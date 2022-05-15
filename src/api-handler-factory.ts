import { Methods, ApiRouteHandler, ApiRouteMiddleware } from './api-middleware-typings';
import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';


type RouteDefinitions = {
  handler: ApiRouteHandler,
  preHooks?: ApiRouteMiddleware[],
  postHooks?: ApiRouteMiddleware[]
};

type Options = {
  handlerMissingResponse?: () => unknown;
  errorHandler?: (error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<void>;
}

function executeAll(hooks: (ApiRouteHandler | ApiRouteMiddleware)[], req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, seed: Promise<unknown> = Promise.resolve()): Promise<unknown> {
  return hooks.reduce((acc, hook) => {
    return acc.then(() => hook(req, res, context))
  }, seed);
}

function defaultRouteMissingMessage() {
  return {message: 'not found'};
}

function defaultErrorHandler(error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) {
  throw  error;
}

export function createHandlers(definitions: Partial<Record<Methods, RouteDefinitions>>, opts: Options = {}): (req: NextApiRequest, res: NextApiResponse) => (void) {

  const {
    handlerMissingResponse = defaultRouteMissingMessage,
    errorHandler = defaultErrorHandler
  } = opts;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const definition = definitions[req.method?.toLowerCase() as Methods];
    if (definition == null) return res.status(404).json(handlerMissingResponse());
    const {handler, preHooks = [], postHooks = []} = definition;
    const context = new PerRequestContext();

    try {
      await executeAll(preHooks, req, res, context);
      await handler(req, res, context);
      await executeAll(postHooks, req, res, context);
    } catch (e) {
      await errorHandler(e, req, res, context);
    } finally {
      await context.destroy()
    }
  }
}
