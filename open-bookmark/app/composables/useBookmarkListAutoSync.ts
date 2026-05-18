import type { BookmarkListRevision } from "#shared/types/bookmarkRevision";
import { BOOKMARK_LIST_POLL_MS } from "#shared/constants/bookmarkSync";
import { bookmarkListRevisionFingerprint } from "#shared/lib/bookmarkListRevision";

export function useBookmarkListAutoSync(options: {
  onChanged: () => void | Promise<void>;
}) {
  const fingerprint = ref<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | undefined;

  async function pollRevision(): Promise<void> {
    if (import.meta.server || document.visibilityState === "hidden") {
      return;
    }

    try {
      const revision = await $fetch<BookmarkListRevision>("/api/bookmarks/revision");
      const next = bookmarkListRevisionFingerprint(revision);

      if (fingerprint.value !== null && fingerprint.value !== next) {
        await options.onChanged();
      }

      fingerprint.value = next;
    } catch {
      // Polling failures are non-fatal; the next tick retries.
    }
  }

  function stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  }

  function start(): void {
    if (import.meta.server || intervalId) {
      return;
    }

    void pollRevision();
    intervalId = setInterval(() => {
      void pollRevision();
    }, BOOKMARK_LIST_POLL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pollRevision();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    onScopeDispose(() => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    });
  }

  return { start };
}
