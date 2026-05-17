const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "mc_eid",
  "ref",
]);

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

export function normalizeUrl(input: string): { url: string; normalized_url: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new UrlValidationError("URL darf nicht leer sein.");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new UrlValidationError("Ungültige URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new UrlValidationError("Nur http- und https-URLs sind erlaubt.");
  }

  parsed.hostname = parsed.hostname.toLowerCase();

  const params = new URLSearchParams(parsed.search);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
      params.delete(key);
    }
  }
  parsed.search = params.toString() ? `?${params.toString()}` : "";

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  const url = parsed.toString();
  const normalized_url = url;

  return { url, normalized_url };
}

export function parseUrlList(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
