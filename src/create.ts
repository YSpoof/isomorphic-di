import type { Provider, Token } from "./types";

const tokenLabel = (token: Token<unknown>): string => token.name || "anonymous token";

const missingProvider = (token: Token<unknown>): Error => new Error(`No provider found for ${tokenLabel(token)}`);

export const createFromProvider = (provider: Provider): unknown => {
  if ("useValue" in provider) return provider.useValue;
  if (typeof provider.useFactory === "function") return provider.useFactory();
  if (typeof provider.useClass === "function") return new provider.useClass();

  throw new Error("Invalid provider");
};

const isNotConstructor = (error: unknown): boolean =>
  error instanceof TypeError && /is not a constructor/i.test(error.message);

export const instantiate = <T>(token: Token<T>): T => {
  const Ctor = token as new (...args: any[]) => T;

  try {
    return new Ctor();
  } catch (error) {
    if (isNotConstructor(error)) throw missingProvider(token);
    throw error;
  }
};
