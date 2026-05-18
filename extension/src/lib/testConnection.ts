import { listTags } from "./openBookmarkApi";
import { OpenBookmarkApiError } from "./types";
import { mapApiErrorToUserMessage } from "./mapApiError";

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export async function testConnection(baseUrl: string): Promise<ConnectionTestResult> {
  try {
    const tags = await listTags(baseUrl);
    const count = tags.length;
    const label = count === 1 ? "Tag" : "Tags";
    return {
      ok: true,
      message: `Verbindung erfolgreich (${count} ${label} gefunden).`,
    };
  } catch (error) {
    if (error instanceof OpenBookmarkApiError && error.kind === "config") {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: mapApiErrorToUserMessage(error),
    };
  }
}
