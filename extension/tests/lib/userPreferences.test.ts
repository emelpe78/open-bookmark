import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLastFormInputs,
  setLastFormInputs,
} from "../../src/lib/userPreferences";

function createLocalStorageMock(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    get: vi.fn((keys: string | string[]) => {
      if (typeof keys === "string") {
        return Promise.resolve({ [keys]: data[keys] });
      }
      const result: Record<string, string | undefined> = {};
      for (const key of keys) {
        result[key] = data[key];
      }
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, string>) => {
      Object.assign(data, items);
      return Promise.resolve();
    }),
  };
}

describe("userPreferences", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: { local: createLocalStorageMock() },
    });
  });

  it("returns empty defaults", async () => {
    await expect(getLastFormInputs()).resolves.toEqual({ tags: "", notes: "" });
  });

  it("roundtrips tags and notes", async () => {
    await setLastFormInputs({ tags: "nuxt, docs", notes: "Merken" });
    await expect(getLastFormInputs()).resolves.toEqual({
      tags: "nuxt, docs",
      notes: "Merken",
    });
  });
});
