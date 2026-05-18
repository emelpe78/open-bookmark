# AGENTS.md

Leitfaden für AI-Agents am Projekt **Open Bookmark** — lokaler Bookmark-Manager (Nuxt 4, SQLite, **Electron Desktop macOS**) plus **Chrome Extension** (Manifest V3). Details: [`README.md`](README.md), Desktop: [`desktop/README.md`](desktop/README.md), Extension: [`extension/README.md`](extension/README.md).

## Produkt (MVP)

- **local-first**, Single-User, **ohne Auth**, **ohne LLM**
- URLs speichern, Metadaten per Server-Fetch (Cheerio), Karten-UI, Suche, Tags, Markdown-Notizen
- **macOS Desktop-App:** Electron startet Nitro auf `127.0.0.1:3777`, SQLite unter Application Support
- **Chrome Extension:** Side-Load aus `extension/dist`; speichert per HTTP-API (kein Store im MVP)
- Open Source — keine Secrets, keine `.db`-Dateien committen

**Nicht einführen** (ohne explizite Anfrage): Auth, Accounts, Playwright/Crawling, Cron/Worker, externe DB, FTS, Cloud-only, Docker.

## Repository-Layout

| Pfad | Inhalt |
|------|--------|
| `open-bookmark/` | Nuxt-4-App (Quellcode, API, SQLite) |
| `extension/` | Chrome Extension (MV3, Vite, TypeScript) |
| `desktop/` | Electron Main/Preload, Packaging |
| `docs/` | PRD, ADRs |

## Stack & Layout (Web-App)

| Bereich | Pfad (`open-bookmark/`) |
|---------|-------------------------|
| UI | `app/pages/`, `app/components/`, `app/layouts/` |
| Composables | `app/composables/useBookmarks.ts`, `useBookmarkModals.ts`, `useBookmarkForm.ts`, `useDesktopBridge.ts` |
| Shared | `shared/constants/`, `shared/lib/`, `shared/errors/`, `shared/types/` |
| Domain | `server/domain/bookmarkService.ts`, `createBookmarkService.ts` |
| Repositories | `server/repositories/bookmarkRepository.ts`, `tagRepository.ts` |
| API | `server/api/bookmarks/`, `server/api/tags/` |
| HTTP-Adapter | `server/utils/http/mapBookmarkError.ts`, `parseRouteParams.ts` |
| Metadaten | `server/utils/metadata.ts` (`extractMetadataFromHtml`, `fetchPageHtml`) |
| Markdown | `lib/markdown.ts` |
| Extension-Onboarding | `app/pages/extension.vue`, `app/components/OnboardingModal.vue` |

## Desktop (`desktop/`)

| Bereich | Pfad |
|---------|------|
| Main | `src/main.ts` |
| Preload | `src/preload.ts` → `window.openBookmarkDesktop` |
| Runtime-Start | `src/runtime/startRuntime.ts` (Child: `node .output/server/index.mjs`) |
| Packaging | `package.json` → `electron-builder`, `scripts/build-runtime.sh` |

**Desktop-Regeln**

- Keine Fachlogik in Electron — nur Shell, Spawn, IPC, Packaging.
- `HOST=127.0.0.1`, Port **3777** fix (MVP); bei `EADDRINUSE` Fehler-UI.
- `DATABASE_PATH` = `app.getPath('userData')/bookmarks.db`, `app.setName('Open Bookmark')`.
- Renderer: `contextIsolation` + `sandbox`, kein `nodeIntegration`.

## Chrome Extension (`extension/`)

Eigenes npm-Package — **kein** Nuxt, **kein** Nuxt UI. TypeScript + Vite + `@crxjs/vite-plugin`, Popup/Options als HTML/CSS.

| Bereich | Pfad |
|---------|------|
| Popup | `src/popup/` |
| Einstellungen | `src/options/` |
| Service Worker | `src/background/service-worker.ts` (Kontextmenü) |
| API-Client | `src/lib/openBookmarkApi.ts`, `apiClient.ts` |
| Speichern | `src/lib/saveBookmark.ts` |
| Konfiguration | `src/lib/config.ts` (`DEFAULT_SERVER_BASE_URL`: `http://localhost:3777`) |

**Extension-Regeln**

- Nutzt **nur** die HTTP-API — keine Backend-Duplikation.
- Server-URL: Desktop/Dev **`http://localhost:3777`** (≈ `127.0.0.1:3777`).
- Side-Load only im MVP; In-App-Anleitung unter `/extension`.

```bash
cd extension && npm install && npm run build
cd extension && npm run test && npm run typecheck
```

**Wichtig:** Domain wirft **keine** `createError`-HTTP-Fehler — nur `BookmarkDomainError`. HTTP-Mapping in `server/utils/http/`.

**Env:** `APP_PORT=3777`, `DATABASE_PATH` (Dev: `./data/bookmarks.db`; Desktop setzt Application Support).

## UI-Regeln

- **Nuxt UI** — Theming `app/app.config.ts`
- Formulare: `BookmarkFormFields` + `useBookmarkForm`; Fehler: `extractFetchError`
- Add: `BookmarkAddModal` | Edit: `BookmarkEditModal`

## Datenbank

Tabellen: `bookmarks`, `tags`, `bookmark_tags`. Duplikate über `normalized_url`. Leere Notizen als `null`.

## API

| Methode | Pfad | Extension |
|---------|------|-----------|
| GET | `/api/bookmarks` | Duplikat/Update |
| POST | `/api/bookmarks` | Speichern |
| PATCH | `/api/bookmarks/:id` | Tags/Notizen |
| DELETE | `/api/bookmarks/:id` | — |
| GET | `/api/tags` | Vorschläge, Health |
| POST | `/api/bookmarks/:id/refresh` | Metadaten neu laden |

## Entwicklung

**Web-App**

```bash
cd open-bookmark && npm install && npm run dev
npm run typecheck && npm run test
```

**Desktop**

```bash
cd open-bookmark && npm run build
cd desktop && npm install && npm run dev
cd desktop && npm run build:runtime && npm run pack:dir
```

**Extension**

```bash
cd extension && npm install && npm run build
npm run typecheck && npm run test
```

## Sicherheit

Niemals `.env`, `*.db`, Keys committen. Nitro nur auf Loopback (`127.0.0.1`).

## Definition of Done

**Web-App:** SQLite, Nuxt UI, `npm run test` + `typecheck` grün in `open-bookmark/`.
**Desktop:** `npm run typecheck` + `pack:dir` grün in `desktop/`; Runtime + Extension-Onboarding dokumentiert.
**Extension:** `npm run test` + `typecheck` + `build` grün; README aktuell; API unverändert.
