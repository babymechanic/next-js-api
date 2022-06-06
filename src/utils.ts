import { FuncReturnsPromise } from './api-middleware-typings';

export const createdOneTimeCallable = (callable: FuncReturnsPromise, errorMessage = 'was invoked more than once so ignoring second call'): FuncReturnsPromise => {
  return (() => {
    let executed = false;
    return async (): Promise<void> => {
      if (executed) {
        console.error(errorMessage);
      } else {
        executed = true;
        return callable();
      }
    }
  })();
}


