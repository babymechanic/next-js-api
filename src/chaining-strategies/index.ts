import { StopAtFirstError } from './stop-at-first-error';
import { ContinueAlwaysOnError } from './continue-always-on-error';
import { ContinueButSkipHandlerOnError } from './continue-but-skip-handler-on-error';

export class ChainingStrategies {
  public static readonly StopAtFirstError = new StopAtFirstError();
  public static readonly ContinueAlwaysOnError = new ContinueAlwaysOnError();
  public static readonly ContinueButSkipHandlerOnError = new ContinueButSkipHandlerOnError();
}
