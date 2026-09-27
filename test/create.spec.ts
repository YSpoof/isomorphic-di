import { describe, expect, it } from "vitest";
import { createFromProvider, instantiate } from "../src/create";
import type { Provider, Token } from "../src/types";

describe("createFromProvider", () => {
  it("returns useValue, including falsy values", () => {
    class Token {}

    expect(createFromProvider({ provide: Token, useValue: undefined })).toBeUndefined();
    expect(createFromProvider({ provide: Token, useValue: 0 })).toBe(0);
    expect(createFromProvider({ provide: Token, useValue: false })).toBe(false);
  });

  it("calls useFactory", () => {
    class Token {}
    const value = { ok: true };

    expect(createFromProvider({ provide: Token, useFactory: () => value })).toBe(value);
  });

  it("constructs useClass", () => {
    class Token {}
    class Impl {}

    expect(createFromProvider({ provide: Token, useClass: Impl })).toBeInstanceOf(Impl);
  });

  it("rejects a provider with no strategy", () => {
    class Token {}

    expect(() => createFromProvider({ provide: Token } as unknown as Provider)).toThrow("Invalid provider");
  });
});

describe("instantiate", () => {
  it("constructs a class token", () => {
    class Service {}

    expect(instantiate(Service)).toBeInstanceOf(Service);
  });

  it("rethrows errors from the constructor", () => {
    class Boom {
      constructor() {
        throw new Error("boom");
      }
    }

    expect(() => instantiate(Boom)).toThrow("boom");
  });

  it("reports a missing provider when the token is not a constructor", () => {
    expect(() => instantiate((() => {}) as unknown as Token<unknown>)).toThrow(
      "No provider found for anonymous token",
    );
  });
});
