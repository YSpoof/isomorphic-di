import type { Scope } from "./types";

type Storage<T> = {
  run<R>(store: T, fn: () => R): R;
  getStore(): T | undefined;
};

export class SyncStorage<T> implements Storage<T> {
  #current: T | undefined;

  run<R>(store: T, fn: () => R): R {
    const previous = this.#current;
    this.#current = store;
    try {
      return fn();
    } finally {
      this.#current = previous;
    }
  }

  getStore(): T | undefined {
    return this.#current;
  }
}

// Not a static `node:async_hooks` import: that breaks browser bundles.
// AsyncLocalStorage keeps the scope across await. Otherwise the scope is synchronous.
const builtinAsyncLocalStorage = (): (new <T>() => Storage<T>) | undefined => {
  const fromGlobal = (globalThis as { AsyncLocalStorage?: new <T>() => Storage<T> }).AsyncLocalStorage;
  if (typeof fromGlobal === "function") return fromGlobal;

  const getBuiltinModule = (
    globalThis as {
      process?: {
        getBuiltinModule?: (id: string) => { AsyncLocalStorage?: new <T>() => Storage<T> };
      };
    }
  ).process?.getBuiltinModule;

  if (typeof getBuiltinModule !== "function") return undefined;

  try {
    const loaded = getBuiltinModule("node:async_hooks").AsyncLocalStorage;
    if (typeof loaded === "function") return loaded;
  } catch {
    return undefined;
  }

  return undefined;
};

export const scopeStorage: Storage<Scope> = new (builtinAsyncLocalStorage() ?? SyncStorage)();
