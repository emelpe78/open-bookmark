import { BOOKMARK_ERROR_MESSAGES } from "#shared/errors/bookmarkErrors";

const FALLBACK_MESSAGE = "Speichern fehlgeschlagen.";

export function extractFetchError(error: unknown, fallback = FALLBACK_MESSAGE): string {
  if (error && typeof error === "object") {
    const fetchError = error as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
    };
    if (fetchError.data?.statusMessage) {
      return fetchError.data.statusMessage;
    }
    if (fetchError.data?.message) {
      return fetchError.data.message;
    }
    if (fetchError.statusMessage) {
      return fetchError.statusMessage;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getClientValidationMessage(
  key: keyof typeof BOOKMARK_ERROR_MESSAGES | "EMPTY_URL",
): string {
  if (key === "EMPTY_URL") {
    return "Bitte eine URL eingeben.";
  }
  return BOOKMARK_ERROR_MESSAGES[key];
}
