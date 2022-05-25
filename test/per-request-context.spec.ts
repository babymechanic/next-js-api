import { expect } from 'chai';
import * as sinon from 'sinon';
import { PerRequestContext } from '../src/per-request-context';

describe('#PerRequestContext', () => {


  it('should be able to set an item in the context', function () {
    const expectedValue = 'expected value';
    const key = 'testKey';
    const context = new PerRequestContext();

    context.addItem(key, expectedValue)

    const actual = context.getItem(key) as string;
    expect(actual).to.equal(expectedValue);
  });


  it('should be able to call the destroy hooks for all the items in the context', async function () {
    const context = new PerRequestContext();
    const resource1 = 'resource1';
    const tearDown1 = sinon.stub();
    const resource2 = 'resource2';
    const tearDown2 = sinon.stub();
    context.addItem('resource1', resource1, tearDown1);
    context.addItem('resource2', resource2, tearDown2);

    await context.destroy();

    sinon.assert.calledWith(tearDown1, resource1);
    sinon.assert.calledWith(tearDown2, resource2);
  });

  it('should ensure destroy is called for all dependencies even if one of them throws an error and rethrow the first error', async function () {
    const context = new PerRequestContext();
    const resource1 = 'resource1';
    const tearDown1 = sinon.stub();
    const error = new Error('something went wrong');
    tearDown1.throws(error);
    context.addItem('resource1', resource1, tearDown1);
    const resource2 = 'resource2';
    const tearDown2 = sinon.stub();
    context.addItem('resource2', resource2, tearDown2);
    try {

      await context.destroy();

      expect.fail('should have thrown an error');
    } catch (e: any) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal('something went wrong')
      sinon.assert.calledWith(tearDown1, resource1);
      sinon.assert.calledWith(tearDown2, resource2);
    }
  });

});
