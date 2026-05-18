import { describe, expect, it } from "vitest";
import { parseBookmarkExportHtml } from "../../shared/lib/parseBookmarkExportHtml";

const CHROME_EXPORT = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<Title>Bookmarks</Title>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">Lesezeichenleiste</H3>
    <DL><p>
        <DT><A HREF="https://example.com/" ADD_DATE="1700000000">Example</A>
        <DT><A HREF="https://other.test/page" ADD_DATE="1700000001">Other</A>
    </DL><p>
    <DT><H3>Ordner</H3>
    <DL><p>
        <DT><A HREF="https://example.com/">Duplicate path</A>
        <DT><A HREF="javascript:void(0)">Bad</A>
        <DT><A HREF="https://nested.example/path">Nested</A>
    </DL><p>
</DL><p>`;

describe("parseBookmarkExportHtml", () => {
  it("extracts http(s) links and skips javascript URLs", () => {
    const urls = parseBookmarkExportHtml(CHROME_EXPORT);
    expect(urls).toEqual([
      "https://example.com/",
      "https://other.test/page",
      "https://nested.example/path",
    ]);
  });

  it("deduplicates identical href strings", () => {
    const html = `<a href="https://dup.test">A</a><a href="https://dup.test">B</a>`;
    expect(parseBookmarkExportHtml(html)).toEqual(["https://dup.test"]);
  });

  it("returns empty array when no links", () => {
    expect(parseBookmarkExportHtml("<html><body><p>empty</p></body></html>")).toEqual([]);
  });
});
