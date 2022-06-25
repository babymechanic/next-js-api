![tests](https://github.com/babymechanic/next-middle-api-query-parser/actions/workflows/run-tests.yml/badge.svg)

# next-middle-api

## Features
- [Set handlers for different http methods](https://github.com/babymechanic/next-middle-api#route-definitions-for-http-methods) 
- [Define middlewares to run before and after the handler](https://github.com/babymechanic/next-middle-api#middleware)
- [Per request context which allows you to pass common dependencies across the whole chain](https://github.com/babymechanic/next-middle-api#middleware)
- [Customize execution chain behaviour with 3 defaults](https://github.com/babymechanic/next-middle-api#chaining-strategies)
- [Create resources like connections and resources with teardown per request](https://github.com/babymechanic/next-middle-api#middleware)
- [Intercept the call in the middleware and short circuit](https://github.com/babymechanic/next-middle-api#use-middleware-to-intercept-the-call)

## Available plugins

- Handle query params [next-middle-api-query-parser](https://www.npmjs.com/package/next-middle-api-query-parser).

## Route definitions for HTTP methods

Create route handlers for http methods

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'next-middle-api'

export default createHandlers({
  get: { // http methods e.g. post, get, patch, delete
    handler: async (req, res) => {
      res.status(200).json({name: 'hello'})
    }
  }
});
```

## Middleware

Use middlewares to create reusable dependencies for the handlers and optional clean up.
The cleanup callback will be called even if any failures take place.
This comes in handy when you are dealing things like connections or db transactions.

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'next-middle-api'

async function closeConnection(value: unknown) {
  // close your connection
  console.log(`Disposing ${value}`);
}

function createConnection(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  // create your connection or transaction
  context.addItem('test', 'db connection', closeConnection);
  return next();
}

function commitOrRollbackTransaction(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  // check the response to decide to commit or rollback 
  const connection = context.getItem('test');
  console.log(`post hook response code was ${res.statusCode}`);
  return next();
}

export default createHandlers({
  get: {
    handler: async (req, res, context) => {
      res.status(200).json({name: context.getItem('test')})
    },
    preHooks: [createConnection],
    postHooks: [commitOrRollbackTransaction]
  }
});
```

### Use middleware to intercept the call

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'next-middle-api'

async function setFromMiddleware(req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>): Promise<void> {
  res.status(401).json({message: 'you are not authorised'})
}

export default createHandlers({
  get: {
    handler: async (req, res, context) => {
      res.status(200).json({name: 'this will not be called'})
    },
    preHooks: [setFromMiddleware]
  }
});
```

## Global error handling

Define a function to handle an error in case of an error.

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, HandlerOptions, PerRequestContext } from 'next-middle-api'


const opts: HandlerOptions = {
  errorHandler(error: unknown, req: NextApiRequest, res: NextApiResponse, context: PerRequestContext): Promise<void> {
    res.status(503).json({error: (error as Error).message})
  }
};

export default createHandlers({
  get: {
    handler: async (req, res, context) => {
      throw new Error('something fell apart');
    },
  }
}, opts);
```

## Custom 404 Response

```typescript
import { createHandlers, HandlerOptions } from 'next-middle-api';

const opts: HandlerOptions = {
  handlerMissingResponse() {
    return {message: 'my custom 404 message'}
  }
};

export default createHandlers({
  post: {
    handler: async (req, res) => {
      res.status(200).json({message: 'This was a post'})
    }
  },
}, opts);
```

## Chaining Strategies

By default, on error the chain stops executing.  

Out of the box the supported strategies are:
- Stop at first error in the chain
  - It will just use the `errorHandler` option that was passed which by default bubbles the error to the root.
- Execute all even on error
  - It will execute all the middlewares and route handler even on error
  - You need to make sure that you handle the error and return an appropriate response
  - The context `firstError` prop has the first error that occurred. 
  - The `errors` prop will give all the errors.
- Execute on error but skip the handler
  - It will execute all the middlewares but skip the route handler on error
  - You need to make sure that you handle the error and return an appropriate response
  - The context `firstError` prop has the first error that occurred.
  - The `errors` prop will give all the errors.

You can choose to implement your own custom strategy by implementing `IChainingStrategy` and using it instead

The example below shows how to change the chaining strategy. 

```typescript
import { HandlerOptions, ApiRouteMiddleware, createHandlers, ChainingStrategies } from 'next-middle-api';

const alwaysThrowError: ApiRouteMiddleware = async () => {
  throw new Error('some new error');
};

const returnErrorMessage: ApiRouteMiddleware = async (req, res, context, next) => {
  if (!context.hasError) return next();
  const message = (context.firstError as any).message;
  res.status(500).json({message: `${message} was found later down stream`});
  await next();
};

const opts: HandlerOptions = {
  chainingStrategy: ChainingStrategies.ContinueButSkipHandlerOnError
};

export default createHandlers({
  get: {
    handler: async (req, res) => {
      res.status(200).json({message: 'this handler will not execute'});
    },
    preHooks: [alwaysThrowError],
    postHooks: [returnErrorMessage]
  }
}, opts);
```

# License

MIT License

Copyright (c) 2022 Mohnish Chowdhury

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
