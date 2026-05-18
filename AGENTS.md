# AGENTS.md

Leitfaden für AI-Agents am Projekt **Open-Bookmark** — lokaler Bookmark-Manager (Nuxt 4, SQLite, Docker) plus **Chrome Extension** (Manifest V3). Details: [`README.md`](README.md), Extension: [`extension/README.md`](extension/README.md).

## Produkt (MVP)

- Self-hosted, **local-first**, Single-User, **ohne Auth**, **ohne LLM**
- URLs speichern, Metadaten per Server-Fetch (Cheerio), Karten-UI, Suche, Tags, Markdown-Notizen
- **Chrome Extension:** Seiten/Links aus dem Browser speichern und bestehende Bookmarks (Tags, Notizen) per Popup aktualisieren
- Open Source — keine Secrets, keine `.db`-Dateien committen

**Nicht einführen** (ohne explizite Anfrage): Auth, Accounts, Playwright/Crawling, Cron/Worker, externe DB, FTS, Cloud-only.

## Repository-Layout

| Pfad | Inhalt |
|------|--------|
| `open-bookmark/` | Nuxt-4-App (Quellcode, API, SQLite) |
| `extension/` | Chrome Extension (MV3, Vite, TypeScript) |
| `docker-compose.yml` | Container-Setup für die Web-App |

## Stack & Layout (Web-App)

| Bereich | Pfad (`open-bookmark/`) |
|---------|-------------------------|
| UI | `app/pages/`, `app/components/`, `app/layouts/` |
| Composables | `app/composables/useBookmarks.ts`, `useBookmarkModals.ts`, `useBookmarkForm.ts` |
| Shared | `shared/constants/`, `shared/lib/`, `shared/errors/`, `shared/types/` |
| Domain | `server/domain/bookmarkService.ts`, `createBookmarkService.ts` |
| Repositories | `server/repositories/bookmarkRepository.ts`, `tagRepository.ts` |
| API | `server/api/bookmarks/`, `server/api/tags/` |
| HTTP-Adapter | `server/utils/http/mapBookmarkError.ts`, `parseRouteParams.ts` |
| Metadaten | `server/utils/metadata.ts` (`extractMetadataFromHtml`, `fetchPageHtml`) |
| Markdown | `lib/markdown.ts` |

## Chrome Extension (`extension/`)

Eigenes npm-Package — **kein** Nuxt, **kein** Nuxt UI. TypeScript + Vite + `@crxjs/vite-plugin`, Popup/Options als HTML/CSS.

| Bereich | Pfad |
|---------|------|
| Popup | `src/popup/` |
| Einstellungen | `src/options/` |
| Service Worker | `src/background/service-worker.ts` (Kontextmenü) |
| API-Client | `src/lib/openBookmarkApi.ts`, `apiClient.ts` |
| Speichern | `src/lib/saveBookmark.ts` (`saveOrUpdateBookmark`: Create oder PATCH bei Duplikat + Formularänderung) |
| Tab-URL | `src/lib/activeTab.ts` (`chrome.scripting` + Fallback `tab.url`) |
| Konfiguration | `src/lib/config.ts` (`chrome.storage.sync`: `serverBaseUrl`) |
| Tags/Formular | `src/lib/tagCache.ts`, `userPreferences.ts`, `parseTagInput.ts` |

**Extension-Regeln**

- Nutzt **nur** die bestehende HTTP-API der Web-App — keine parallele Backend-Logik, keine Metadaten-Extraktion in der Extension.
- Host-Zugriff über `optional_host_permissions` + dynamisches `chrome.permissions.request` — **kein** CORS-Workaround in `nuxt.config.ts` nötig.
- Server-Basis-URL muss zum laufenden Port passen (Dev `3777`, Docker oft `3778`).
- Tags beim Update werden **ersetzt** (wie Web-App), nicht gemerged — bestehende Tags im Popup anzeigen/vorausfüllen.
- Unit-Tests nur für `src/lib/*` (Vitest, Mock `fetch`/`chrome`); keine Chrome-E2E im Repo.

**Extension entwickeln**

```bash
cd extension && npm install && npm run build   # Output: extension/dist
cd extension && npm run test && npm run typecheck
```

Installation: entpackte Erweiterung aus `extension/dist` in Chrome laden.

**Wichtig:** Domain und Repositories werfen **keine** `createError`-HTTP-Fehler — nur `BookmarkDomainError`. HTTP-Mapping ausschließlich in `server/utils/http/` und API-Routen.

**Env:** `APP_PORT=3777`, `DATABASE_PATH` (lokal `./data/bookmarks.db`, Docker `/data/bookmarks.db`).

## UI-Regeln

- **Nuxt UI** — kein Tailwind-first-Styling; Theming `app/app.config.ts`
- Formulare: `BookmarkFormFields` + `useBookmarkForm`; Fehler: `extractFetchError`
- Add: `BookmarkAddModal` | Edit: `BookmarkEditModal` (kein Inline-Edit)

## Datenbank

Tabellen: `bookmarks`, `tags`, `bookmark_tags`. Duplikate über `normalized_url`. Leere Notizen als `null`.

## URL & Ingestion

`normalizeUrl` → Metadaten (`resolvePageMetadata`, Fallback bei Fehler) → speichern. Bulk: `POST /api/bookmarks` mit `{ urls: "a, b" }`.

## Pagination

Default **10**, Optionen aus `shared/constants/pagination.ts` (10/25/50/100). `BookmarkListPagination` oben und unten.

## API

Gilt für Web-App und Extension (Extension nutzt Teilmenge).

| Methode | Pfad | Extension |
|---------|------|-----------|
| GET | `/api/bookmarks` | Suche nach URL (Duplikat/Update) |
| POST | `/api/bookmarks` | Neu speichern (Popup, Kontextmenü) |
| PATCH | `/api/bookmarks/:id` | Tags/Notizen aktualisieren |
| DELETE | `/api/bookmarks/:id` | — |
| GET | `/api/tags` | Vorschläge, Verbindungstest |
| POST | `/api/bookmarks/:id/refresh` | Metadaten neu laden (Duplikat-UI) |

## Entwicklung

**Web-App**

```bash
cd open-bookmark && npm install && npm run dev
npm run typecheck
npm run test
```

**Extension** (eigenständig im Ordner `extension/`)

```bash
cd extension && npm install && npm run dev    # oder: npm run build
npm run typecheck
npm run test
```

## Sicherheit

Niemals `.env`, `*.db`, Keys committen.

## Definition of Done

**Web-App:** MVP-Scope, SQLite, Nuxt UI, Docker-tauglich, `npm run test` + `typecheck` grün in `open-bookmark/`. Domain ohne HTTP; eine Quelle für Pagination, Tags, Fehlermeldungen.

**Extension:** `npm run test` + `typecheck` + `build` grün in `extension/`; nutzt API ohne Backend-Änderungen; `extension/README.md` aktuell.
