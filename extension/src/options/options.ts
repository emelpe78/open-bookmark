import {
  getServerBaseUrl,
  requestHostPermissionForBaseUrl,
  setServerBaseUrl,
} from "../lib/config";
import { normalizeBaseUrl } from "../lib/normalizeBaseUrl";
import { refreshTagCache } from "../lib/tagSuggestions";
import { testConnection } from "../lib/testConnection";

const form = document.getElementById("settings-form") as HTMLFormElement;
const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
const testConnectionBtn = document.getElementById(
  "test-connection",
) as HTMLButtonElement;
const statusEl = document.getElementById("status")!;

function setStatus(message: string, variant: "success" | "error" | "" = "") {
  statusEl.textContent = message;
  statusEl.className = "options__status";
  if (variant) {
    statusEl.classList.add(`options__status--${variant}`);
  }
}

async function runConnectionTest(baseUrl: string) {
  const result = await testConnection(baseUrl);
  setStatus(result.message, result.ok ? "success" : "error");
}

async function loadSettings() {
  serverUrlInput.value = await getServerBaseUrl();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  try {
    const normalized = normalizeBaseUrl(serverUrlInput.value);
    await setServerBaseUrl(normalized);
    serverUrlInput.value = normalized;

    const granted = await requestHostPermissionForBaseUrl(normalized);
    if (!granted) {
      setStatus(
        "URL gespeichert, aber der Host-Zugriff wurde nicht erlaubt. Speichern funktioniert erst nach Freigabe.",
        "error",
      );
      return;
    }

    await refreshTagCache(normalized);
    await runConnectionTest(normalized);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Speichern fehlgeschlagen.";
    setStatus(message, "error");
  }
});

testConnectionBtn.addEventListener("click", async () => {
  setStatus("Verbindung wird geprüft…");
  testConnectionBtn.disabled = true;

  try {
    const normalized = normalizeBaseUrl(serverUrlInput.value);
    const granted = await requestHostPermissionForBaseUrl(normalized);
    if (!granted) {
      setStatus(
        "Host-Zugriff fehlt. Bitte zuerst speichern und die Freigabe bestätigen.",
        "error",
      );
      return;
    }
    await runConnectionTest(normalized);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verbindungstest fehlgeschlagen.";
    setStatus(message, "error");
  } finally {
    testConnectionBtn.disabled = false;
  }
});

void loadSettings();
