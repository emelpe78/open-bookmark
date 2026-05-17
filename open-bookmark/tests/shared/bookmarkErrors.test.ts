import { describe, expect, it } from "vitest";
import {
  BOOKMARK_ERROR_CODES,
  BOOKMARK_ERROR_MESSAGES,
  BookmarkDomainError,
} from "../../shared/errors/bookmarkErrors";

describe("bookmarkErrors", () => {
  it("defines a message for every error code", () => {
    for (const code of BOOKMARK_ERROR_CODES) {
      expect(BOOKMARK_ERROR_MESSAGES[code]).toBeTruthy();
    }
  });

  it("BookmarkDomainError carries code and default message", () => {
    const error = new BookmarkDomainError("NOT_FOUND");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe(BOOKMARK_ERROR_MESSAGES.NOT_FOUND);
  });

  it("allows custom message override", () => {
    const error = new BookmarkDomainError("INVALID_URL", "Custom");
    expect(error.message).toBe("Custom");
  });
});
