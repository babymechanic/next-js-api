import sinon from 'sinon';
import { ChainingStrategies } from '../../src/chaining-strategies';
import { PerRequestContext } from '../../src/per-request-context';
import { createRequestStub, createResponseStub } from '../test-utils/nextjs-specific-mocks';
import { expect } from 'chai';

const continueButSkipHandlerOnError = ChainingStrategies.ContinueButSkipHandlerOnError;

describe('#ContinueButSkipHandlerOnError', () => {

  describe('#applyToHandler', () => {

    it('should skip the handler on any existing errors', async function () {
      const context = new PerRequestContext();
      context.registerError('existing error from previous handlers');
      const handlerStub = sinon.stub();
      const callable = continueButSkipHandlerOnError.applyToHandler(handlerStub);
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
      sinon.assert.notCalled(handlerStub);
    });

    it('should invoke handler if there is no existing error', async function () {
      const context = new PerRequestContext();
      const handlerStub = sinon.stub();
      const callable = continueButSkipHandlerOnError.applyToHandler(handlerStub);
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
      sinon.assert.calledOnce(handlerStub);
    });

    it('should invoke next even if the handler throws an error', async function () {
      const context = new PerRequestContext();
      const handlerStub = sinon.stub().throws(new Error('some thing went wrong'));
      const callable = continueButSkipHandlerOnError.applyToHandler(handlerStub);
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
      sinon.assert.calledOnce(handlerStub);
    });

  });

  describe('#applyToMiddleware', () => {

    it('should call next even if the middleware throws an error', async function () {
      const context = new PerRequestContext();
      const callable = continueButSkipHandlerOnError.applyToMiddleware(() => Promise.reject('some issue'));
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.called(nextStub);
      expect(context.firstError).to.equal('some issue');
    });

    it('should call next even if the middleware throws no error', async function () {
      const context = new PerRequestContext();
      const callable = continueButSkipHandlerOnError.applyToMiddleware((req, res, con, next) => next());
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.called(nextStub);
    });

  });
});
