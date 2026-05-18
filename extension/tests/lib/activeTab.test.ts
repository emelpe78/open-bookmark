import { describe, expect, it } from "vitest";
import { isSaveablePageUrl, pickTabPageUrl } from "../../src/lib/activeTab";

describe("activeTab helpers", () => {
  it("pickTabPageUrl prefers tab.url over pendingUrl", () => {
    expect(
      pickTabPageUrl({
        url: "https://developer.mozilla.org/en-US/docs/Web",
        pendingUrl: "https://developer.mozilla.org/",
      } as chrome.tabs.Tab),
    ).toBe("https://developer.mozilla.org/en-US/docs/Web");
  });

  it("pickTabPageUrl rejects chrome internal URLs", () => {
    expect(
      pickTabPageUrl({ url: "chrome://extensions" } as chrome.tabs.Tab),
    ).toBe("");
  });

  it("isSaveablePageUrl accepts https pages", () => {
    expect(isSaveablePageUrl("https://github.com/foo/bar")).toBe(true);
  });
});
