import * as cheerio from "cheerio";

export const MAX_BOOKMARK_HTML_BYTES = 10 * 1024 * 1024;

/**
 * Extracts http(s) bookmark URLs from a Netscape/Chrome bookmarks.html export.
 * Folder headings are ignored; only anchor hrefs are collected.
 */
export function parseBookmarkExportHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")?.trim();
    if (!href || !/^https?:\/\//i.test(href)) {
      return;
    }
    if (seen.has(href)) {
      return;
    }
    seen.add(href);
    urls.push(href);
  });

  return urls;
}

export function validateBookmarkHtmlSize(html: string): void {
  if (Buffer.byteLength(html, "utf8") > MAX_BOOKMARK_HTML_BYTES) {
    throw new Error("Die HTML-Datei ist zu groß (max. 10 MB).");
  }
}
