import sinon from 'sinon';
import { ChainingStrategies } from '../../src/chaining-strategies';
import { PerRequestContext } from '../../src/per-request-context';
import { createRequestStub, createResponseStub } from '../test-utils/nextjs-specific-mocks';
import { expect } from 'chai';

const continueAlwaysOnError = ChainingStrategies.ContinueAlwaysOnError;

describe('#ContinueAlwaysOnError', () => {

  describe('#applyToHandler', () => {

    it('should invoke next if the handler throws an error', async function () {
      const context = new PerRequestContext();
      const expectedError = new Error('some error');
      const handlerStub = sinon.stub().throws(expectedError);
      const callable = continueAlwaysOnError.applyToHandler(handlerStub);
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
      sinon.assert.calledOnce(handlerStub);
      expect(context.firstError).to.equal(expectedError);
    });

    it('should not invoke next if there is no error', async function () {
      const context = new PerRequestContext();
      const callable = continueAlwaysOnError.applyToHandler(() => Promise.resolve());
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.notCalled(nextStub);
    });

  });

  describe('#applyToMiddleware', () => {

    it('should call next even if there is an error', async function () {
      const context = new PerRequestContext();
      const callable = continueAlwaysOnError.applyToMiddleware(() => Promise.reject('some issue'));
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
      expect(context.firstError).to.equal('some issue');
    });

    it('should continue as usual if there is no error', async function () {
      const context = new PerRequestContext();
      const callable = continueAlwaysOnError.applyToMiddleware((req, res, con, next) => next());
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.calledOnce(nextStub);
    });

  });
});
