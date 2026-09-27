import { createFromProvider, instantiate } from "./create";
import { scopeStorage } from "./storage";
import type { Provider, Scope, Token } from "./types";

export type { Provider, Token } from "./types";

const root: Scope = { providers: new Map(), instances: new Map() };
const missing = Symbol();

const read = (scope: Scope | undefined, token: Token<unknown>): unknown => {
  if (!scope) return missing;
  if (scope.instances.has(token)) return scope.instances.get(token);

  const provider = scope.providers.get(token);
  if (!provider) return missing;

  const value = createFromProvider(provider);
  if (!provider.transient) scope.instances.set(token, value);
  return value;
};

const scopeFrom = (providers: readonly Provider[]): Scope => {
  const providersMap: Map<Token<any>, Provider> = new Map();

  for (const provider of providers) providersMap.set(provider.provide, provider);

  return { providers: providersMap, instances: new Map() };
};

type BoundProviders<P> = {
  [I in keyof P]: P[I] extends { provide: Token<infer T> } ? Provider<T> : never;
};

type CheckedProviders<P> = P & NoInfer<BoundProviders<P>>;

export const configure = <const P extends readonly any[]>(providers: CheckedProviders<P>): void => {
  for (const provider of providers) {
    root.providers.set(provider.provide, provider);
    root.instances.delete(provider.provide);
  }
};

export const inject = <T>(token: Token<T>): T => {
  const scope = scopeStorage.getStore();
  const scoped = read(scope, token);
  if (scoped !== missing) return scoped as T;

  const global = read(root, token);
  if (global !== missing) return global as T;

  const created = instantiate(token);
  (scope ?? root).instances.set(token, created);
  return created;
};

export const runInScope = <T, const P extends readonly any[]>(
  providers: CheckedProviders<P>,
  fn: () => T,
): T => scopeStorage.run(scopeFrom(providers), fn);
