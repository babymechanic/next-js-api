type Disposable<T> = (value: T) => Promise<void>;

interface PerRequestContextItem<T> {
  value: T;
  dispose?: Disposable<T>;
}

const wrapDisposeError = (x: PerRequestContextItem<unknown>): { error: any } => {
  try {
    x.dispose?.(x.value)
    return {error: null};
  } catch (e: any) {
    return {error: e};
  }
};

export class PerRequestContext {

  private readonly _items: Map<string, PerRequestContextItem<any>>;
  private readonly _errors: unknown[];

  constructor() {
    this._items = new Map<string, PerRequestContextItem<any>>();
    this._errors = [];
  }

  addItem<T>(key: string, value: T, dispose?: Disposable<T>): void {
    this._items.set(key, {value, dispose});
  }

  registerError(error: unknown) {
    this._errors.push(error);
  }

  get firstError(): unknown {
    return this._errors[0];
  }

  get hasError(): boolean {
    return this._errors.length > 0;
  }

  getItem(key: string): unknown {
    return this._items.get(key)?.value;
  }

  async destroy(): Promise<void> {
    const itemsToDispose = Array.from(this._items.values())
                                .filter(x => x.dispose != null);
    const disposeResults = await Promise.all(itemsToDispose.map(wrapDisposeError));
    const errors = disposeResults.filter(x => x.error != null);
    if (errors.length === 0) return;
    throw errors[0].error;
  }
}
