import * as cheerio from "cheerio";
import type { PageMetadata } from "#shared/types/bookmark";

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Open-Bookmark/1.0 (+https://github.com/open-bookmark; local bookmark manager)";

function resolveAbsoluteUrl(base: string, value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    return new URL(value.trim(), base).toString();
  } catch {
    return null;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return null;
}

export function extractMetadataFromHtml(html: string, pageUrl: string): PageMetadata {
  const $ = cheerio.load(html);

  const title = firstNonEmpty(
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="twitter:title"]').attr("content"),
    $("title").text(),
  );

  const description = firstNonEmpty(
    $('meta[property="og:description"]').attr("content"),
    $('meta[name="description"]').attr("content"),
    $('meta[name="twitter:description"]').attr("content"),
  );

  const imageRaw = firstNonEmpty(
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
  );

  const site_name = firstNonEmpty(
    $('meta[property="og:site_name"]').attr("content"),
    new URL(pageUrl).hostname,
  );

  return {
    title,
    description,
    image_url: resolveAbsoluteUrl(pageUrl, imageRaw ?? undefined),
    site_name,
  };
}

export async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("Kein HTML-Inhalt");
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPageMetadata(url: string): Promise<PageMetadata> {
  const html = await fetchPageHtml(url);
  return extractMetadataFromHtml(html, url);
}

export function fallbackMetadata(url: string): PageMetadata {
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // keep url as fallback
  }

  return {
    title: hostname,
    description: null,
    image_url: null,
    site_name: hostname,
  };
}

export async function resolvePageMetadata(url: string): Promise<PageMetadata> {
  try {
    return await fetchPageMetadata(url);
  } catch {
    return fallbackMetadata(url);
  }
}
