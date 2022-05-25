![tests](https://github.com/babymechanic/next-middle-api-query-parser/actions/workflows/run-tests.yml/badge.svg)

# next-middle-api

This is a tool set to help with building APIs in next js.
Use it to create middleware and handle dependencies with a hook to clean up per request.

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

## middleware

Use middlewares to create reusable dependencies for the handlers and optional clean up

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createHandlers, PerRequestContext } from 'next-middle-api'

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
    handler: async (req, res, context) => {
      res.status(200).json({name: context.getItem('test')})
    },
    preHooks: [setFromMiddleware],
    postHooks: [interceptResponse]
  }
});
```

Use middleware to intercept the call

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
