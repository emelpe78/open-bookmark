const BLOCKED_PREFIXES = ["chrome://", "chrome-extension://", "edge://", "about:"];

export function isSaveablePageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  return !BLOCKED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function pickTabPageUrl(tab: chrome.tabs.Tab | undefined): string {
  if (!tab) {
    return "";
  }
  const candidate = (tab.url ?? tab.pendingUrl ?? "").trim();
  return isSaveablePageUrl(candidate) ? candidate : "";
}

async function readLocationHrefFromTab(tabId: number): Promise<string> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.location.href,
    });
    const href = typeof injection?.result === "string" ? injection.result.trim() : "";
    return isSaveablePageUrl(href) ? href : "";
  } catch {
    return "";
  }
}

/**
 * Resolves the canonical URL for a tab (injected location.href when possible).
 */
export async function resolvePageUrlForTab(
  tab: chrome.tabs.Tab | undefined,
): Promise<string> {
  if (tab?.id) {
    const fromPage = await readLocationHrefFromTab(tab.id);
    if (fromPage) {
      return fromPage;
    }
  }
  return pickTabPageUrl(tab);
}

/**
 * Resolves the URL of the page the user invoked the extension on.
 * Prefers an injected read of window.location.href — tab.url can be missing or stale in popups.
 */
export async function resolveActivePageUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return resolvePageUrlForTab(tab);
}
