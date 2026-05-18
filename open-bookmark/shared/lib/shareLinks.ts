export interface ShareLinkEntry {
  title: string;
  url: string;
}

export interface ShareContent {
  modalTitle: string;
  emailSubject: string;
  clipboardText: string;
  copyActionLabel: string;
}

export function buildBookmarkShareContent(
  title: string,
  url: string,
): ShareContent {
  const label = title.trim() || url;
  return {
    modalTitle: "Lesezeichen teilen",
    emailSubject: `Lesezeichen: ${label}`,
    clipboardText: `${label}\n${url}`,
    copyActionLabel: "Link kopieren",
  };
}

export function buildListShareContent(
  listName: string,
  entries: ShareLinkEntry[],
): ShareContent {
  const header = `Liste: ${listName}`;
  const body =
    entries.length === 0
      ? `${header}\n\n(Keine Lesezeichen in dieser Liste)`
      : [
          header,
          "",
          ...entries.flatMap((entry) => {
            const label = entry.title.trim() || entry.url;
            return [label, entry.url, ""];
          }),
        ].join("\n").trimEnd();

  return {
    modalTitle: "Liste teilen",
    emailSubject: `Liste: ${listName}`,
    clipboardText: body,
    copyActionLabel: "Liste kopieren",
  };
}

export function buildMailtoUrl(subject: string, body: string): string {
  // encodeURIComponent (%20) statt URLSearchParams (+) — Mail-Clients zeigen + oft wörtlich an.
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
