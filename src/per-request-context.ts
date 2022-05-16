type Disposable<T> = (value: T) => Promise<void>;

interface PerRequestContextItem<T> {
  value: T;
  dispose?: Disposable<T>;
}

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
    await Promise.all(itemsToDispose.map(x => x.dispose?.(x.value)))
  }
}
