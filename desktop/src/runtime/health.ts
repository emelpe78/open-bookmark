import { BASE_URL, HEALTH_PATH } from "./constants.js";

export async function waitForRuntimeHealthy(
  timeoutMs = 30_000,
  intervalMs = 250,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const url = `${BASE_URL}${HEALTH_PATH}`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Der lokale Dienst antwortet nicht unter ${BASE_URL}. Bitte prüfe, ob Port 3777 frei ist.`,
  );
}
