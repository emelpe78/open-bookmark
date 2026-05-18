import { describe, expect, it } from "vitest";
import { normalizeBaseUrl } from "../../src/lib/normalizeBaseUrl";

describe("normalizeBaseUrl", () => {
  it("trims whitespace and trailing slash", () => {
    expect(normalizeBaseUrl("  http://localhost:3777/  ")).toBe(
      "http://localhost:3777",
    );
  });

  it("accepts valid http and https URLs", () => {
    expect(normalizeBaseUrl("https://bookmark.example.com")).toBe(
      "https://bookmark.example.com",
    );
  });

  it("rejects empty input", () => {
    expect(() => normalizeBaseUrl("")).toThrow(/Server-Adresse/);
  });

  it("rejects invalid URLs", () => {
    expect(() => normalizeBaseUrl("not-a-url")).toThrow(/ungültig/i);
  });
});
