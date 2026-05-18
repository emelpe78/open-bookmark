import { OpenBookmarkApiError } from "./types";

export function mapApiErrorToUserMessage(error: unknown): string {
  if (error instanceof OpenBookmarkApiError) {
    switch (error.kind) {
      case "config":
        return "Bitte prüfe die Server-Adresse in den Extension-Einstellungen.";
      case "network":
        return "OpenBookmark ist unter der konfigurierten URL nicht erreichbar.";
      case "duplicate":
        return (
          error.message ||
          "Diese Seite ist bereits in OpenBookmark gespeichert."
        );
      case "validation":
        return error.message || "Die Anfrage war ungültig.";
      case "server":
        return error.message || "Das Bookmark konnte nicht gespeichert werden.";
    }
  }

  return "Das Bookmark konnte nicht gespeichert werden.";
}
