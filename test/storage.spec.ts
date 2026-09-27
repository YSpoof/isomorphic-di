import { describe, expect, it } from "vitest";
import { SyncStorage } from "../src/storage";

describe("SyncStorage", () => {
  it("is empty outside run", () => {
    const storage = new SyncStorage<string>();

    expect(storage.getStore()).toBeUndefined();
  });

  it("exposes the store only while the callback runs", () => {
    const storage = new SyncStorage<string>();

    const seen = storage.run("inner", () => storage.getStore());

    expect(seen).toBe("inner");
    expect(storage.getStore()).toBeUndefined();
  });

  it("restores the outer store after a nested run", () => {
    const storage = new SyncStorage<string>();

    storage.run("outer", () => {
      expect(storage.getStore()).toBe("outer");
      storage.run("inner", () => {
        expect(storage.getStore()).toBe("inner");
      });
      expect(storage.getStore()).toBe("outer");
    });
  });

  it("restores the previous store when the callback throws", () => {
    const storage = new SyncStorage<string>();

    storage.run("outer", () => {
      expect(() =>
        storage.run("inner", () => {
          throw new Error("fail");
        }),
      ).toThrow("fail");
      expect(storage.getStore()).toBe("outer");
    });
  });
});
