import { describe, expect, it } from "vitest";
import { configure, inject, runInScope, type Token } from "../src/index";

describe("inject", () => {
  it("caches a singleton and rebuilds a transient", () => {
    class Logger {}
    class Config {}

    configure([
      { provide: Logger, useClass: Logger },
      { provide: Config, useFactory: () => ({ id: Math.random() }), transient: true },
    ]);

    expect(inject(Logger)).toBe(inject(Logger));
    expect(inject(Config)).not.toBe(inject(Config));
  });

  it("keeps a stored undefined", () => {
    const Empty = class Empty {} as unknown as Token<undefined>;

    configure([{ provide: Empty, useValue: undefined }]);

    expect(inject(Empty)).toBeUndefined();
  });

  it("caches an auto-created class on the root", () => {
    class Auto {}

    expect(inject(Auto)).toBe(inject(Auto));
  });

  it("drops the cached singleton when the token is configured again", () => {
    class Service {}

    configure([{ provide: Service, useClass: Service }]);
    const first = inject(Service);
    configure([{ provide: Service, useValue: { id: "replaced" } }]);

    expect(inject(Service)).not.toBe(first);
    expect(inject(Service)).toEqual({ id: "replaced" });
  });

  it("names a missing provider", () => {
    expect(() => inject((() => {}) as unknown as new () => unknown)).toThrow(
      "No provider found for anonymous token",
    );
  });
});

describe("runInScope", () => {
  it("overrides the root and then restores it", () => {
    class Repo {}
    class MockRepo extends Repo {}

    configure([{ provide: Repo, useClass: Repo }]);
    const globalRepo = inject(Repo);
    const scoped = runInScope([{ provide: Repo, useClass: MockRepo }], () => inject(Repo));

    expect(scoped).toBeInstanceOf(MockRepo);
    expect(inject(Repo)).toBe(globalRepo);
  });

  it("reuses a root singleton when the scope does not override it", () => {
    class Logger {}

    configure([{ provide: Logger, useClass: Logger }]);
    const logger = inject(Logger);

    expect(runInScope([], () => inject(Logger))).toBe(logger);
  });

  it("does not see the parent scope", () => {
    class Repo {}
    class MockRepo extends Repo {}
    class Logger {}

    configure([{ provide: Repo, useClass: Repo }]);
    const globalRepo = inject(Repo);

    const nested = runInScope([{ provide: Repo, useClass: MockRepo }], () =>
      runInScope([{ provide: Logger, useClass: Logger }], () => inject(Repo)),
    );

    expect(nested).toBe(globalRepo);
  });

  it("caches an auto-created class on the scope, not the root", () => {
    class ScopedAuto {}

    const inside = runInScope([], () => inject(ScopedAuto));

    expect(inject(ScopedAuto)).not.toBe(inside);
  });

  it("keeps the scope across await", async () => {
    class RequestId {
      constructor(readonly id: string) {}
    }

    const seen = await runInScope([{ provide: RequestId, useValue: new RequestId("req") }], async () => {
      await Promise.resolve();
      return inject(RequestId).id;
    });

    expect(seen).toBe("req");
  });

  it("keeps concurrent scopes apart", async () => {
    class RequestId {
      constructor(readonly id: string) {}
    }

    const wait = (ms: number) => {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, ms);
      return promise;
    };

    const ids = await Promise.all([
      runInScope([{ provide: RequestId, useValue: new RequestId("a") }], async () => {
        await wait(20);
        return inject(RequestId).id;
      }),
      runInScope([{ provide: RequestId, useValue: new RequestId("b") }], async () => {
        await wait(10);
        return inject(RequestId).id;
      }),
    ]);

    expect(ids).toEqual(["a", "b"]);
  });
});
