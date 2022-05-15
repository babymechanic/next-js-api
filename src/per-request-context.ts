interface PerRequestContextItem<T> {
  value: T;
  dispose?: (value: T) => Promise<void>;
}

export class PerRequestContext {

  private readonly _items: Map<string, PerRequestContextItem<unknown>>;

  constructor() {
    this._items = new Map<string, PerRequestContextItem<unknown>>();
  }

  addItem(key: string, item: PerRequestContextItem<unknown>): void {
    this._items.set(key, item);
  }

  getItem(key: string): unknown {
    return this._items.get(key)?.value;
  }

  async destroy(): Promise<void> {
    this._items.forEach(item => {
      if (item.dispose == null) return;
      item.dispose(item.value);
    })
  }
}
