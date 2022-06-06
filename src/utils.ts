import { FuncReturnsPromise } from './api-middleware-typings';

export class InvalidCallError extends Error {
}

export const createdOneTimeCallable = (callable: FuncReturnsPromise, errorMessage = 'was invoked more than once'): FuncReturnsPromise => {
  return (() => {
    let executed = false;
    return (): Promise<void> => {
      if (executed) {
        throw new InvalidCallError(errorMessage);
      }
      executed = true;
      return callable()
    }
  })();
}


