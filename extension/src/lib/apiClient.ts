import { OpenBookmarkApiError } from "./types";

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface ApiRequestOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      statusMessage?: string;
      message?: string;
    };
    return data.statusMessage ?? data.message ?? response.statusText;
  } catch {
    return response.statusText || "Unbekannter Fehler";
  }
}

export function mapStatusToError(
  status: number,
  message: string,
): OpenBookmarkApiError {
  if (status === 409) {
    return new OpenBookmarkApiError("duplicate", message, status);
  }
  if (status === 400) {
    return new OpenBookmarkApiError("validation", message, status);
  }
  return new OpenBookmarkApiError("server", message, status);
}

export async function apiRequest(
  baseUrl: string,
  path: string,
  init: RequestInit,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const trimmedBase = baseUrl.trim();
  if (!trimmedBase) {
    throw new OpenBookmarkApiError("config", "Keine Server-URL konfiguriert.");
  }

  const fetchFn = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchFn(`${trimmedBase}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof OpenBookmarkApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OpenBookmarkApiError(
        "network",
        "OpenBookmark ist unter der konfigurierten URL nicht erreichbar.",
      );
    }
    throw new OpenBookmarkApiError(
      "network",
      "OpenBookmark ist unter der konfigurierten URL nicht erreichbar.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readApiError(response: Response): Promise<never> {
  const message = await readErrorMessage(response);
  throw mapStatusToError(response.status, message);
}
