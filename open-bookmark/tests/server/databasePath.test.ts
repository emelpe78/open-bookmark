import { afterEach, describe, expect, it } from "vitest";
import { WEB_DEV_DATABASE_PATH } from "../../shared/constants/database";
import { resolveConfiguredDatabasePath } from "../../server/utils/db";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("resolveConfiguredDatabasePath", () => {
  it("uses DATABASE_PATH in desktop mode", () => {
    process.env.OPEN_BOOKMARK_DESKTOP = "1";
    process.env.DATABASE_PATH =
      "/Users/test/Library/Application Support/Open Bookmark/bookmarks.db";

    expect(resolveConfiguredDatabasePath()).toBe(process.env.DATABASE_PATH);
  });

  it("throws in desktop mode without DATABASE_PATH", () => {
    process.env.OPEN_BOOKMARK_DESKTOP = "1";
    delete process.env.DATABASE_PATH;
    delete process.env.NUXT_DATABASE_PATH;

    expect(() => resolveConfiguredDatabasePath()).toThrow(/DATABASE_PATH/);
  });

  it("uses DATABASE_PATH from env in web dev", () => {
    delete process.env.OPEN_BOOKMARK_DESKTOP;
    process.env.DATABASE_PATH = "./data/bookmarks.db";

    expect(resolveConfiguredDatabasePath()).toMatch(/data\/bookmarks\.db$/);
  });
});

describe("WEB_DEV_DATABASE_PATH", () => {
  it("points at the local dev database", () => {
    expect(WEB_DEV_DATABASE_PATH).toBe("./data/bookmarks.db");
  });
});
