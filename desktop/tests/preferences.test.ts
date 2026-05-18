import { describe, expect, it } from "vitest";
import { isValidDatabasePath } from "../src/preferencesValidation.js";

describe("isValidDatabasePath", () => {
  it("accepts absolute paths ending with .db", () => {
    expect(isValidDatabasePath("/Users/test/Library/bookmarks.db")).toBe(true);
  });

  it("rejects relative paths", () => {
    expect(isValidDatabasePath("./data/bookmarks.db")).toBe(false);
  });

  it("rejects paths without .db suffix", () => {
    expect(isValidDatabasePath("/tmp/bookmarks.sqlite")).toBe(false);
  });
});
