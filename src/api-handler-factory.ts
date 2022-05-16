import { ApiRouteHandler, ApiRouteMethods, ApiRouteMiddleware } from './api-middleware-typings';
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

type FuncReturnsPromise = () => Promise<void>;

function defaultRouteMissingMessage() {
  return {message: 'not found'};
}

function defaultErrorHandler(error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) {
  throw  error;
}

function wrapHandler(handler: (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => void): ApiRouteMiddleware {
  return (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise): Promise<void> => {
    handler(req, res, context);
    return next()
  }
}

function createChainRunner(preHooks: ApiRouteMiddleware[],
                           handler: ApiRouteHandler,
                           postHooks: ApiRouteMiddleware[],
                           req: NextApiRequest,
                           res: NextApiResponse,
                           context: PerRequestContext): FuncReturnsPromise {
  const handlerWrapper: ApiRouteMiddleware = wrapHandler(handler);
  const reversedMiddlewares: ApiRouteMiddleware[] = [...preHooks, handlerWrapper, ...postHooks].reverse();
  const chain = reversedMiddlewares.reduce((acc: FuncReturnsPromise, middleware: ApiRouteMiddleware) => {
    return (() => middleware(req, res, context, acc))
  }, (() => Promise.resolve()));
  return chain ?? (() => Promise.resolve());
}

export function createHandlers(definitions: Partial<Record<ApiRouteMethods, RouteDefinitions>>, opts: Options = {}): (req: NextApiRequest, res: NextApiResponse) => (void) {

  const {
    handlerMissingResponse = defaultRouteMissingMessage,
    errorHandler = defaultErrorHandler
  } = opts;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const definition = definitions[req.method?.toLowerCase() as ApiRouteMethods];
    if (definition == null) return res.status(404).json(handlerMissingResponse());
    const {handler, preHooks = [], postHooks = []} = definition;
    const context = new PerRequestContext();
    try {
      const chainRunner = createChainRunner(preHooks, handler, postHooks, req, res, context);
      await chainRunner()
    } catch (e) {
      await errorHandler(e, req, res, context);
    } finally {
      await context.destroy()
    }
  }
}
