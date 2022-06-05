import { NextApiRequest, NextApiResponse } from 'next';
import { createHandlers, FuncReturnsPromise } from '../src/api-handler-factory';
import { ApiRouteMethods, HandlerOptions } from '../src/api-middleware-typings';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { expect } from 'chai';
import { PerRequestContext } from '../src/per-request-context';

function createRequestStub(verb: ApiRouteMethods) {
  return {
    method: verb
  } as NextApiRequest
}

function createResponseStub(statusMethodStub: SinonStub, jsonMethodStub: SinonStub) {
  statusMethodStub.returns({json: jsonMethodStub});
  return {
    status: statusMethodStub as any
  } as NextApiResponse
}

const callNext = async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise) => {
  await next();
};

function setStubsToCallNext(stubs: SinonStub[]) {
  return stubs.map((x) => x.returns(Promise.resolve()).callsFake(callNext));
}

describe('#createHandlers', () => {

  it('should return a 404 if the handler is not there for the verb', async function () {
    const handler = createHandlers({
      get: {
        async handler() {
        }
      }
    });
    const request = createRequestStub('post');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    sinon.assert.calledWith(statusMethodStub, 404);
    sinon.assert.calledWith(jsonMethodStub, {message: 'not found'});
  });


  it('should be able to customize the 404 response', async function () {
    const expectedResponse = {message: 'this is a custom message'};
    const opts: HandlerOptions = {handlerMissingResponse: () => expectedResponse};

    const handler = createHandlers({
      get: {
        handler: async () => {
        }
      }
    }, opts);
    const request = createRequestStub('post');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    sinon.assert.calledWith(statusMethodStub, 404);
    sinon.assert.calledWith(jsonMethodStub, expectedResponse);
  });


  it('should call the handler provided', async function () {
    const expectedJson = {message: 'seems ok'};
    const handler = createHandlers({
      get: {
        handler: async (req, res) => res.status(200).json(expectedJson)
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    sinon.assert.calledWith(statusMethodStub, 200);
    sinon.assert.calledWith(jsonMethodStub, expectedJson);
  });

  it('should call all the middlewares in the right order', async function () {
    const [preHook1, preHook2, postHook1, postHook2] = setStubsToCallNext([sinon.stub(), sinon.stub(), sinon.stub(), sinon.stub()])
    const handler = createHandlers({
      get: {
        handler: async (req, res) => res.status(200).json({message: 'ok'}),
        preHooks: [preHook1, preHook2],
        postHooks: [postHook1, postHook2]
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    expect(preHook1.calledBefore(preHook2)).to.equal(true);
    expect(preHook2.calledBefore(statusMethodStub)).to.equal(true);
    expect(statusMethodStub.calledBefore(jsonMethodStub)).to.equal(true);
    expect(jsonMethodStub.calledBefore(postHook1)).to.equal(true);
    expect(postHook1.calledBefore(postHook2)).to.equal(true);
  });

  it('should call all the middlewares', async function () {
    const [preHook1, preHook2, postHook1, postHook2] = setStubsToCallNext([sinon.stub(), sinon.stub(), sinon.stub(), sinon.stub()]);
    const handler = createHandlers({
      get: {
        handler: async (req, res) => res.status(200).json({message: 'ok'}),
        preHooks: [preHook1, preHook2],
        postHooks: [postHook1, postHook2]
      }
    });
    const request = createRequestStub('get');
    const response = createResponseStub(sinon.stub(), sinon.stub());

    await handler(request, response);

    sinon.assert.calledWith(preHook1, request, response, sinon.match.instanceOf(PerRequestContext), sinon.match.func);
    sinon.assert.calledWith(preHook2, request, response, sinon.match.instanceOf(PerRequestContext), sinon.match.func);
    sinon.assert.calledWith(postHook1, request, response, sinon.match.instanceOf(PerRequestContext), sinon.match.func);
    sinon.assert.calledWith(postHook2, request, response, sinon.match.instanceOf(PerRequestContext), sinon.match.func);
  });

  it('should not call the next call in the chain if next is not called', async function () {
    const preHook = sinon.stub().returns(Promise.resolve()).callsFake((req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).json({message: 'this call was intercepted'});
    });
    const handler = createHandlers({
      get: {
        handler: async () => expect.fail('this call should not have happened'),
        preHooks: [preHook],
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response);

    sinon.assert.calledWith(preHook, request, response, sinon.match.instanceOf(PerRequestContext), sinon.match.func);
    sinon.assert.calledWith(statusMethodStub, 200);
    sinon.assert.calledWith(jsonMethodStub, {message: 'this call was intercepted'});
  });

  it('should call the provided error handler if there is an error', async function () {
    const opts: HandlerOptions = {
      errorHandler: async (error, req, res) => {
        res.status(500).json({message: (error as Error).message});
      }
    };
    const errorMessage = 'something went wrong';

    const handler = createHandlers({
      get: {
        handler: async () => {
          throw new Error(errorMessage)
        }
      }
    }, opts);
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    sinon.assert.calledWith(statusMethodStub, 500);
    sinon.assert.calledWith(jsonMethodStub, {message: errorMessage});
  });

  it('should raise the error by default on error', async function () {
    const errorMessage = 'something went wrong';
    const handler = createHandlers({
      get: {
        handler: async () => {
          throw new Error(errorMessage)
        }
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);
    try {

      await handler(request, response);

    } catch (e: any) {
      expect(e.message).to.equal(errorMessage);
    }
  });

  it('should call destroy on the context after all hooks are called', async function () {
    const testResource = 'testResource';
    const cleanUp = sinon.stub().returns(Promise.resolve());
    const preHook1 = sinon.stub().returns(Promise.resolve()).callsFake((req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise) => {
      context.addItem('testKey', testResource, cleanUp);
      next();
    })
    const [preHook2, postHook1, postHook2] = setStubsToCallNext([sinon.stub(), sinon.stub(), sinon.stub()])
    const handler = createHandlers({
      get: {
        handler: async (req, res) => res.status(200).json({message: 'ok'}),
        preHooks: [preHook1, preHook2],
        postHooks: [postHook1, postHook2]
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);

    await handler(request, response)

    sinon.assert.calledWith(cleanUp, testResource);
    expect(cleanUp.calledAfter(preHook1)).to.equal(true);
    expect(cleanUp.calledAfter(preHook2)).to.equal(true);
    expect(cleanUp.calledAfter(postHook1)).to.equal(true);
    expect(cleanUp.calledAfter(postHook2)).to.equal(true);
    expect(cleanUp.calledAfter(statusMethodStub)).to.equal(true);
    expect(cleanUp.calledAfter(jsonMethodStub)).to.equal(true);
  });


  it('should call destroy on the context even if there is an error', async function () {
    const testResource = 'testResource';
    const cleanUp = sinon.stub().returns(Promise.resolve());
    const preHook1 = sinon.stub().returns(Promise.resolve()).callsFake((req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise) => {
      context.addItem('testKey', testResource, cleanUp);
      next();
    })
    const [preHook2, postHook1, postHook2] = setStubsToCallNext([sinon.stub(), sinon.stub(), sinon.stub()])
    const handler = createHandlers({
      get: {
        handler: async () => Promise.reject('something went wrong'),
        preHooks: [preHook1, preHook2],
        postHooks: [postHook1, postHook2]
      }
    });
    const request = createRequestStub('get');
    const statusMethodStub = sinon.stub();
    const jsonMethodStub = sinon.stub();
    const response = createResponseStub(statusMethodStub, jsonMethodStub);
    try {

      await handler(request, response)

      expect.fail('this should not be executed');
    } catch (e) {
      sinon.assert.calledWith(cleanUp, testResource);
      sinon.assert.notCalled(postHook1);
      sinon.assert.notCalled(postHook2);
      sinon.assert.called(preHook1);
      sinon.assert.called(preHook2);
    }
  });

});
