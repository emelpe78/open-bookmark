import { describe, expect, it } from "vitest";
import { bookmarkListRevisionFingerprint } from "../../shared/lib/bookmarkListRevision";

describe("bookmarkListRevisionFingerprint", () => {
  it("combines total and latest update timestamp", () => {
    expect(
      bookmarkListRevisionFingerprint({
        total: 3,
        latestUpdatedAt: "2026-05-18 10:00:00",
      }),
    ).toBe("3:2026-05-18 10:00:00");
  });

  it("uses empty suffix when there are no bookmarks", () => {
    expect(
      bookmarkListRevisionFingerprint({
        total: 0,
        latestUpdatedAt: null,
      }),
    ).toBe("0:");
  });
});
