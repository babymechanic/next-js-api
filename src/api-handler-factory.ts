import { Methods, NoobApiRouteHandler, PerRequestContext } from './api-middleware-typings';


type RouteDefinitions = {
  handler: NoobApiRouteHandler,
  preHooks?: NoobApiRouteHandler[],
  postHooks?: NoobApiRouteHandler[],
};

function executeAll(hooks: NoobApiRouteHandler[], req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, seed: Promise<unknown> = Promise.resolve()): Promise<unknown> {
  return hooks.reduce((acc, currentHandler) => {
    return acc.then(() => currentHandler(req, res, context))
  }, seed);
}

export function createNextJsRouteHandler(definitions: Partial<Record<Methods, RouteDefinitions>>): (req: NextApiRequest, res: NextApiResponse) => (void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const definition = definitions[req.method?.toLowerCase() as Methods];
    if (definition == null) return res.status(404).json({ message: 'not found' });
    const { handler, preHooks = [], postHooks = [] } = definition;
    const context: PerRequestContext = new PerRequestContext(req.query);
    await executeAll(preHooks, req, res, context);
    if (context.middlewareResponse != null) {
      await context.destroy();
      const { status, data } = context.middlewareResponse;
      return res.status(status).json(data);
    }
    try {
      await handler(req, res, context);
      await executeAll(postHooks, req, res, context);
    } catch (e) {
      console.error(e);
      context.error = e;
      await executeAll(postHooks, req, res, context);
      throw e;
    } finally {
      await context.destroy();
    }
  }
}
