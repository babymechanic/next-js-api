import { NextApiRequest, NextApiResponse } from 'next';
import { createHandlers, FuncReturnsPromise } from '../src/api-handler-factory';
import { ApiRouteMethods } from '../src/api-middleware-typings';
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
        handler() {
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
    const opts = {handlerMissingResponse: () => expectedResponse};

    const handler = createHandlers({
      get: {
        handler: () => {
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
        handler: (req, res) => res.status(200).json(expectedJson)
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
        handler: (req, res, context) => res.status(200).json({message: 'ok'}),
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
        handler: (req, res) => res.status(200).json({message: 'ok'}),
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
        handler: () => expect.fail('this call should not have happened'),
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

});
