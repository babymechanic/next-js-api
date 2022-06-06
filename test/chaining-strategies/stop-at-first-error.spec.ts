import sinon from 'sinon';
import { ChainingStrategies } from '../../src/chaining-strategies';
import { PerRequestContext } from '../../src/per-request-context';
import { createRequestStub, createResponseStub } from '../test-utils/nextjs-specific-mocks';
import { expect } from 'chai';

const stopAtFirstError = ChainingStrategies.StopAtFirstError;

describe('#StopAtFirstError', () => {

  describe('#applyToHandler', () => {

    it('should stop not invoke next if there is an error', async function () {
      const context = new PerRequestContext();
      const callable = stopAtFirstError.applyToHandler(() => Promise.reject('some issue'));
      const nextStub = sinon.stub();
      try {

        await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

        expect.fail('should not have come here');
      } catch (e) {
        sinon.assert.notCalled(nextStub);
        expect(e).to.equal('some issue');
      }
    });

    it('should stop invoke next if there is no error', async function () {
      const context = new PerRequestContext();
      const callable = stopAtFirstError.applyToHandler(() => Promise.resolve());
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.called(nextStub);
    });

  });

  describe('#applyToMiddleware', () => {

    it('should stop not swallow error', async function () {
      const context = new PerRequestContext();
      const callable = stopAtFirstError.applyToMiddleware(() => Promise.reject('some issue'));
      const nextStub = sinon.stub();
      try {

        await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

        expect.fail('should not have come here');
      } catch (e) {
        sinon.assert.notCalled(nextStub);
        expect(e).to.equal('some issue');
      }
    });

    it('should stop invoke next if there is no error', async function () {
      const context = new PerRequestContext();
      const callable = stopAtFirstError.applyToMiddleware((req, res, con, next) => next());
      const nextStub = sinon.stub();

      await callable(createRequestStub('post'), createResponseStub(), context, nextStub)

      sinon.assert.called(nextStub);
    });

  });
});
