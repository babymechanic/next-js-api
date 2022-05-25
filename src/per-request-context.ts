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

  constructor() {
    this._items = new Map<string, PerRequestContextItem<any>>();
  }

  addItem<T>(key: string, value: T, dispose?: Disposable<T>): void {
    this._items.set(key, {value, dispose});
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
