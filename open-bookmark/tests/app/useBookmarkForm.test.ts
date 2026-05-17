import { describe, expect, it } from "vitest";
import { useBookmarkForm } from "../../app/composables/useBookmarkForm";

describe("useBookmarkForm", () => {
  const { parseTagsFromInput, buildNotesPayload, validateUrlNotEmpty } = useBookmarkForm();

  it("buildNotesPayload returns null for empty notes", () => {
    expect(buildNotesPayload("   ")).toBeNull();
    expect(buildNotesPayload("hello")).toBe("hello");
  });

  it("validateUrlNotEmpty returns error message when empty", () => {
    expect(validateUrlNotEmpty("")).toBe("Bitte eine URL eingeben.");
    expect(validateUrlNotEmpty("https://x.com")).toBeNull();
  });

  it("parseTagsFromInput delegates to shared parser", () => {
    expect(parseTagsFromInput("a, b")).toEqual(["a", "b"]);
  });
});
