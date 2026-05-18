import { BASE_URL } from "./constants.js";

interface DatabaseHealthResponse {
  isDesktop?: boolean;
}

export async function waitForRuntimeHealthy(
  timeoutMs = 30_000,
  intervalMs = 250,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const url = `${BASE_URL}/api/database`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (!response.ok) {
        throw new Error("not ok");
      }

      const body = (await response.json()) as DatabaseHealthResponse;
      if (body.isDesktop === true) {
        return;
      }

      throw new Error("wrong runtime");
    } catch (error) {
      if (
        error instanceof Error
        && error.message === "wrong runtime"
      ) {
        throw new Error(
          `Port 3777 wird von der Web-Entwicklungsumgebung (npm run dev) belegt. Beende den Dev-Server und starte Open Bookmark Desktop erneut.`,
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Der lokale Dienst antwortet nicht unter ${BASE_URL}. Bitte prüfe, ob Port 3777 frei ist.`,
  );
}
