import { describe, expect, it } from "vitest";
import { mapApiErrorToUserMessage } from "../../src/lib/mapApiError";
import { OpenBookmarkApiError } from "../../src/lib/types";

describe("mapApiErrorToUserMessage", () => {
  it("maps config errors to settings hint", () => {
    expect(
      mapApiErrorToUserMessage(
        new OpenBookmarkApiError("config", "Keine Server-URL konfiguriert."),
      ),
    ).toMatch(/Einstellungen/);
  });

  it("maps network errors to unreachable message", () => {
    expect(
      mapApiErrorToUserMessage(
        new OpenBookmarkApiError("network", "Failed to fetch"),
      ),
    ).toBe(
      "OpenBookmark ist unter der konfigurierten URL nicht erreichbar.",
    );
  });

  it("maps duplicate errors to server message or default", () => {
    expect(
      mapApiErrorToUserMessage(
        new OpenBookmarkApiError(
          "duplicate",
          "Bookmark existiert bereits.",
          409,
        ),
      ),
    ).toBe("Bookmark existiert bereits.");
  });

  it("maps unknown errors to generic save failure", () => {
    expect(mapApiErrorToUserMessage(new Error("boom"))).toBe(
      "Das Bookmark konnte nicht gespeichert werden.",
    );
  });
});
