import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SERVER_BASE_URL,
  getServerBaseUrl,
  setServerBaseUrl,
} from "../../src/lib/config";

function createStorageMock(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    get: vi.fn((keys: string | string[] | Record<string, unknown>) => {
      if (typeof keys === "string") {
        return Promise.resolve({ [keys]: data[keys] });
      }
      if (Array.isArray(keys)) {
        const result: Record<string, string | undefined> = {};
        for (const key of keys) {
          result[key] = data[key];
        }
        return Promise.resolve(result);
      }
      const result: Record<string, string | undefined> = {};
      for (const key of Object.keys(keys)) {
        result[key] = data[key] ?? (keys[key] as string | undefined);
      }
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, string>) => {
      Object.assign(data, items);
      return Promise.resolve();
    }),
  };
}

describe("config", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: { sync: createStorageMock() },
      permissions: {
        contains: vi.fn().mockResolvedValue(true),
        request: vi.fn().mockResolvedValue(true),
      },
    });
  });

  it("returns default when nothing stored", async () => {
    await expect(getServerBaseUrl()).resolves.toBe(DEFAULT_SERVER_BASE_URL);
  });

  it("roundtrips server base URL", async () => {
    await setServerBaseUrl("http://127.0.0.1:3778");
    await expect(getServerBaseUrl()).resolves.toBe("http://127.0.0.1:3778");
  });
});
