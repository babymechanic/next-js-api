# nextjs-api-tools

This a tool set to help with building APIs in next js.

## Route definitions for HTTP methods

Create route handlers for http methods

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'nextjs-api-tools'

export default createHandlers({
  get: { // http methods e.g. post, get, patch, delete
    handler: (req, res) => {
      res.status(200).json({name: 'hello'})
    }
  }
});
```

## middleware

- Use middlewares to create reusable dependencies for the handlers and optional clean up

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'nextjs-api-tools/dist/index'

async function cleanUp(value: unknown) {
  console.log(`Disposing ${value}`);
}

function setFromMiddleware(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  context.addItem('test', 'hi from middleware', cleanUp);
  return next();
}

function interceptResponse(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  console.log(`post hook response code was ${res.statusCode}`);
  return next();
}

export default createHandlers({
  get: {
    handler: (req, res, context) => {
      res.status(200).json({name: context.getItem('test')})
    },
    preHooks: [setFromMiddleware],
    postHooks: [interceptResponse]
  }
});
```

- Use middleware to intercept the call

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'nextjs-api-tools'

async function setFromMiddleware(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  res.status(401).json({message: 'you are not authorised'})
}

export default createHandlers({
  get: {
    handler: (req, res, context) => {
      res.status(200).json({name: 'this will not be called'})
    },
    preHooks: [setFromMiddleware]
  }
});
```

## Global error handling

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, HandlerOptions, PerRequestContext } from 'nextjs-api-tools'


const opts: HandlerOptions = {
  errorHandler(error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext): Promise<void> {
    res.status(503).json({error: (error as Error).message})
  }
};

export default createHandlers({
  get: {
    handler: (req, res, context) => {
      throw new Error('something fell apart');
    },
  }
}, opts);
```

