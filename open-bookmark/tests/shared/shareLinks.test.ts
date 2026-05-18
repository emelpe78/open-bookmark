import { describe, expect, it } from "vitest";
import {
  buildBookmarkShareContent,
  buildListShareContent,
  buildMailtoUrl,
} from "../../shared/lib/shareLinks";

describe("shareLinks", () => {
  it("formats bookmark share content", () => {
    const content = buildBookmarkShareContent("Example", "https://example.com");
    expect(content.clipboardText).toBe("Example\nhttps://example.com");
    expect(content.emailSubject).toBe("Lesezeichen: Example");
  });

  it("formats list share content with entries", () => {
    const content = buildListShareContent("Lesen", [
      { title: "A", url: "https://a.com" },
      { title: "B", url: "https://b.com" },
    ]);
    expect(content.clipboardText).toContain("Liste: Lesen");
    expect(content.clipboardText).toContain("https://a.com");
    expect(content.clipboardText).toContain("https://b.com");
  });

  it("builds mailto URL with percent-encoded spaces", () => {
    const url = buildMailtoUrl(
      "Marc Lettau — Webdesigner",
      "Titel mit Leerzeichen\nhttps://example.com",
    );
    expect(url).toBe(
      "mailto:?subject=Marc%20Lettau%20%E2%80%94%20Webdesigner&body=Titel%20mit%20Leerzeichen%0Ahttps%3A%2F%2Fexample.com",
    );
    expect(url).not.toContain("+");
  });
});
