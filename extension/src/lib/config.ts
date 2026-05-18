import { normalizeBaseUrl } from "./normalizeBaseUrl";

export const DEFAULT_SERVER_BASE_URL = "http://localhost:3777";
const STORAGE_KEY = "serverBaseUrl";

export async function getServerBaseUrl(): Promise<string> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  if (typeof stored === "string" && stored.trim()) {
    return stored;
  }
  return DEFAULT_SERVER_BASE_URL;
}

export async function setServerBaseUrl(url: string): Promise<void> {
  const normalized = normalizeBaseUrl(url);
  await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
}

export function originPatternFromBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  return `${parsed.origin}/*`;
}

export async function requestHostPermissionForBaseUrl(
  baseUrl: string,
): Promise<boolean> {
  const origin = originPatternFromBaseUrl(baseUrl);
  const hasPermission = await chrome.permissions.contains({
    origins: [origin],
  });
  if (hasPermission) {
    return true;
  }
  return chrome.permissions.request({ origins: [origin] });
}
