import { FuncReturnsPromise } from './api-middleware-typings';

export class InvalidCallError extends Error {
}

export const createdOneTimeCallable = (callable: FuncReturnsPromise): FuncReturnsPromise => {
  return (() => {
    let executed = false;
    return (): Promise<void> => {
      if (executed) {
        throw new InvalidCallError('was invoked more than once');
      }
      executed = true;
      return callable()
    }
  })();
}


