import { resolveActivePageUrl } from "../lib/activeTab";
import { getServerBaseUrl, originPatternFromBaseUrl } from "../lib/config";
import { findBookmarkByUrl } from "../lib/findBookmarkByUrl";
import { mapApiErrorToUserMessage } from "../lib/mapApiError";
import { refreshBookmark } from "../lib/openBookmarkApi";
import { saveOrUpdateBookmark } from "../lib/saveBookmark";
import { attachTagAutocomplete } from "../lib/tagAutocomplete";
import { refreshTagCache } from "../lib/tagSuggestions";
import { OpenBookmarkApiError } from "../lib/types";

const pageTitleEl = document.getElementById("page-title")!;
const pageUrlEl = document.getElementById("page-url")!;
const tagsEl = document.getElementById("tags") as HTMLInputElement;
const tagSuggestionsListEl = document.getElementById(
  "tag-suggestions-list",
) as HTMLUListElement;

const tagAutocomplete = attachTagAutocomplete(tagsEl, tagSuggestionsListEl);
const notesEl = document.getElementById("notes") as HTMLTextAreaElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const duplicateActionsEl = document.getElementById("duplicate-actions")!;
const duplicateOpenAppBtn = document.getElementById(
  "duplicate-open-app",
) as HTMLButtonElement;
const duplicateRefreshBtn = document.getElementById(
  "duplicate-refresh",
) as HTMLButtonElement;
const openAppBtn = document.getElementById("open-app") as HTMLButtonElement;
const openOptionsBtn = document.getElementById("open-options") as HTMLButtonElement;

let duplicateBookmarkId: number | null = null;
let currentPageUrl = "";

function setStatus(
  message: string,
  variant: "idle" | "loading" | "success" | "error" | "warning" = "idle",
) {
  statusEl.textContent = message;
  statusEl.className = "popup__status";
  if (variant !== "idle") {
    statusEl.classList.add(`popup__status--${variant}`);
  }
}

function hideDuplicateActions() {
  duplicateActionsEl.hidden = true;
  duplicateRefreshBtn.hidden = true;
  duplicateBookmarkId = null;
}

function showDuplicateActions(bookmarkId: number | null) {
  duplicateActionsEl.hidden = false;
  duplicateBookmarkId = bookmarkId;
  duplicateRefreshBtn.hidden = bookmarkId === null;
}

function applyFormFromBookmark(tags: string[], notes: string | null) {
  tagsEl.value = tags.join(", ");
  notesEl.value = notes ?? "";
}

async function openApp() {
  const baseUrl = await getServerBaseUrl();
  await chrome.tabs.create({ url: baseUrl });
}

async function loadExistingBookmarkForm(pageUrl: string) {
  const baseUrl = await getServerBaseUrl();
  const hasPermission = await chrome.permissions.contains({
    origins: [originPatternFromBaseUrl(baseUrl)],
  });
  if (!hasPermission) {
    return;
  }

  try {
    const existing = await findBookmarkByUrl(baseUrl, pageUrl);
    if (existing) {
      applyFormFromBookmark(existing.tags, existing.notes);
    }
  } catch {
    // Optional preload; ignore failures.
  }
}

async function handleDuplicate(pageUrl: string) {
  setStatus(
    "Diese Seite ist bereits gespeichert. Ändere Tags oder Notiz zum Aktualisieren.",
    "warning",
  );

  try {
    const baseUrl = await getServerBaseUrl();
    const existing = await findBookmarkByUrl(baseUrl, pageUrl);
    if (existing) {
      applyFormFromBookmark(existing.tags, existing.notes);
    }
    showDuplicateActions(existing?.id ?? null);
  } catch {
    showDuplicateActions(null);
  }
}

async function loadActiveTab() {
  saveBtn.disabled = true;
  hideDuplicateActions();
  setStatus("");

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const title = tab?.title?.trim() || "Unbekannter Titel";
  const url = await resolveActivePageUrl();
  currentPageUrl = url;

  pageTitleEl.textContent = title;
  pageUrlEl.textContent = url || "Keine URL für diesen Tab verfügbar.";
  saveBtn.disabled = !url;

  tagsEl.value = "";
  notesEl.value = "";

  if (url) {
    await loadExistingBookmarkForm(url);
  }
}

saveBtn.addEventListener("click", async () => {
  const url = await resolveActivePageUrl();
  if (!url) {
    setStatus("Für diesen Tab kann keine URL gespeichert werden.", "error");
    return;
  }

  currentPageUrl = url;
  pageUrlEl.textContent = url;
  saveBtn.disabled = true;
  hideDuplicateActions();
  setStatus("Speichern…", "loading");

  try {
    const result = await saveOrUpdateBookmark(url, {
      notes: notesEl.value,
      tags: tagsEl.value,
    });
    const tagHint =
      result.bookmark.tags.length > 0
        ? ` Tags: ${result.bookmark.tags.join(", ")}.`
        : "";
    const message = result.updated
      ? `Bookmark aktualisiert.${tagHint}`
      : `Bookmark gespeichert.${tagHint}`;
    setStatus(message, "success");
    const baseUrl = await getServerBaseUrl();
    await refreshTagCache(baseUrl);
    await tagAutocomplete.reload();
  } catch (error) {
    if (error instanceof OpenBookmarkApiError && error.kind === "duplicate") {
      await handleDuplicate(url);
      return;
    }
    const message =
      error instanceof Error
        ? error.message
        : mapApiErrorToUserMessage(error);
    setStatus(message, "error");
  } finally {
    const refreshed = await resolveActivePageUrl();
    saveBtn.disabled = !refreshed;
  }
});

duplicateOpenAppBtn.addEventListener("click", () => {
  void openApp();
});

duplicateRefreshBtn.addEventListener("click", async () => {
  if (duplicateBookmarkId === null) {
    return;
  }

  duplicateRefreshBtn.disabled = true;
  setStatus("Metadaten werden aktualisiert…", "loading");

  try {
    const baseUrl = await getServerBaseUrl();
    await refreshBookmark(baseUrl, duplicateBookmarkId);
    setStatus("Metadaten aktualisiert.", "success");
    hideDuplicateActions();
    if (currentPageUrl) {
      await loadExistingBookmarkForm(currentPageUrl);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : mapApiErrorToUserMessage(error);
    setStatus(message, "error");
  } finally {
    duplicateRefreshBtn.disabled = false;
  }
});

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

openAppBtn.addEventListener("click", () => {
  void openApp();
});

void loadActiveTab();
