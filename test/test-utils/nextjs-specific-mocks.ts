import { ApiRouteMethods, FuncReturnsPromise } from '../../src/api-middleware-typings';
import { NextApiRequest, NextApiResponse } from 'next';
import { SinonStub } from 'sinon';
import { PerRequestContext } from '../../src/per-request-context';
import * as sinon from 'sinon';

export function createRequestStub(verb: ApiRouteMethods) {
  return {
    method: verb
  } as NextApiRequest
}

export function createResponseStub(statusMethodStub: SinonStub = sinon.stub(), jsonMethodStub: SinonStub = sinon.stub()) {
  statusMethodStub.returns({json: jsonMethodStub});
  return {
    status: statusMethodStub as (statusCode: number) => NextApiResponse<unknown>
  } as NextApiResponse
}

const callNext = async (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: FuncReturnsPromise) => {
  await next();
};

export function setStubsToCallNext(stubs: SinonStub[]) {
  return stubs.map((x) => x.returns(Promise.resolve()).callsFake(callNext));
}
