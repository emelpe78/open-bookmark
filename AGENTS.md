# AGENTS.md

Leitfaden für AI-Agents am Projekt **Open Bookmark** — lokaler Bookmark-Manager (Nuxt 4, SQLite, **Electron Desktop macOS**) plus **Chrome Extension** (Manifest V3). Details: [`README.md`](README.md), Domäne: [`CONTEXT.md`](CONTEXT.md), Desktop: [`desktop/README.md`](desktop/README.md), Extension: [`extension/README.md`](extension/README.md).

## Produkt (MVP)

- **local-first**, Single-User, **ohne Auth**, **ohne LLM**
- URLs speichern (einzeln + Bulk), Metadaten per Server-Fetch (Cheerio), Karten-UI, Suche/Filter, Tags, **Listen**, Markdown-Notizen
- **macOS Desktop-App:** Electron startet Nitro auf `127.0.0.1:3777`, SQLite unter Application Support
- **Chrome Extension:** Side-Load aus GitHub-Releases-Zip (Dev: `extension/dist`); speichert per HTTP-API (kein Store im MVP)
- Open Source — keine Secrets, keine `.db`-Dateien committen

**Nicht einführen** (ohne explizite Anfrage): Auth, Accounts, Playwright/Crawling, Cron/Worker, externe DB, FTS, Cloud-only, Docker.

## Repository-Layout

| Pfad | Inhalt |
|------|--------|
| `open-bookmark/` | Nuxt-4-App (Quellcode, API, SQLite) |
| `extension/` | Chrome Extension (MV3, Vite, TypeScript) |
| `desktop/` | Electron Main/Preload, Packaging |

## Stack & Layout (Web-App)

| Bereich | Pfad (`open-bookmark/`) |
|---------|-------------------------|
| UI | `app/pages/`, `app/components/`, `app/layouts/` |
| Composables | `app/composables/` — u. a. `useBookmarks`, `useBookmarkModals`, `useBookmarkForm`, `useBookmarkBulkSelection`, `useDesktopBridge`, `useListAdmin`, `useTagAdmin`, `useTagSuggestions`, `useBookmarkListAutoSync`, `useDatabaseSettings` |
| Shared | `shared/constants/`, `shared/lib/`, `shared/errors/`, `shared/types/` |
| Domain | `server/domain/bookmarkService.ts`, `createBookmarkService.ts` |
| Repositories | `server/repositories/bookmarkRepository.ts`, `tagRepository.ts`, `listRepository.ts` |
| API | `server/api/bookmarks/`, `server/api/tags/`, `server/api/lists/` |
| HTTP-Adapter | `server/utils/http/mapBookmarkError.ts`, `parseRouteParams.ts`, `parseListId.ts`, `parseTagId.ts` |
| Datenbank-Utils | `server/utils/databaseDump.ts`, `databaseImport.ts`, `databaseInfo.ts`, `db.ts`, `normalizeUrl.ts`, `schemaMigrations.ts`, `tags.ts`, `validation.ts`, `createMemoryDatabase.ts` |
| Metadaten | `server/utils/metadata.ts` (`extractMetadataFromHtml`, `fetchPageHtml`) |
| Plugins | `server/plugins/desktop-public-config.ts`, `database.ts` |
| Markdown | `lib/markdown.ts` |
| Einstellungen / Extension | `app/pages/settings.vue` (`SettingsDatabaseSection`, `SettingsTagsPanel`, `SettingsListsPanel`, `SettingsThemeField`, `useDatabaseSettings`), `app/components/settings/` (6 Komponenten), `extension.vue`, `OnboardingModal.vue` |

## Desktop (`desktop/`)

| Bereich | Pfad |
|---------|------|
| Main | `src/main.ts`, `menu.ts`, `aboutDialog.ts`, `appIcon.ts`, `preferencesValidation.ts` |
| Preload | `src/preload.cjs` (CommonJS) → `window.openBookmarkDesktop` |
| DB-Pfad / Prefs | `src/preferences.ts`, `src/database/relocateDatabase.ts`, `src/runtime/paths.ts` |
| Runtime | `src/runtime/startRuntime.ts`, `constants.ts`, `health.ts`, `port.ts`, `runDatabaseImport.ts` |
| Branding | `src/appMetadata.ts`; Dev-Dock: `Open Bookmark.app` via `scripts/patch-electron-mac.sh` + `scripts/run-dev.sh` |
| Packaging | `package.json` → `electron-builder`, `scripts/build-runtime.sh`, `codesign-mac-app.sh`, `generate-icons.mjs`, `prepare-node.sh` |

**Desktop-Regeln**

- Keine Fachlogik in Electron — nur Shell, Spawn, IPC, Packaging.
- `HOST=127.0.0.1`, Port **3777** fix (MVP); bei `EADDRINUSE` / laufendem `npm run dev` Fehler-UI.
- **Eine produktive DB:** Standard `~/Library/Application Support/Open Bookmark/bookmarks.db`; optional anderer Pfad in `preferences.json` (Einstellungen → Pfad ändern). Web-Dev nutzt **nur** `./data/bookmarks.db` — nie dieselbe Datei wie Desktop.
- Child-Env: `DATABASE_PATH`, `NUXT_DATABASE_PATH`, `OPEN_BOOKMARK_DESKTOP=1`. Pfad-Auflösung: `server/utils/db.ts` (`resolveConfiguredDatabasePath`).
- Dev: `npm run dev` in `desktop/` (nicht `electron .`); Port 3777 nicht mit `open-bookmark` Dev teilen.
- Renderer: `contextIsolation`, Preload **ohne** `nodeIntegration`; `sandbox: false` (Preload-Kompatibilität).

## Chrome Extension (`extension/`)

Eigenes npm-Package — **kein** Nuxt, **kein** Nuxt UI. TypeScript + Vite + `@crxjs/vite-plugin`, Popup/Options als HTML/CSS.

| Bereich | Pfad |
|---------|------|
| Popup | `src/popup/` |
| Einstellungen | `src/options/` |
| Service Worker | `src/background/service-worker.ts` (Kontextmenü) |
| API-Client | `src/lib/openBookmarkApi.ts`, `apiClient.ts`, `mapApiError.ts`, `testConnection.ts` |
| Tag-Helper | `src/lib/tagAutocomplete.ts`, `tagCache.ts`, `tagInputComposer.ts`, `tagSuggestions.ts`, `normalizeTagName.ts`, `parseTagInput.ts` |
| Tab-Helper | `src/lib/activeTab.ts`, `findBookmarkByUrl.ts`, `bookmarkFormChanges.ts` |
| Speichern | `src/lib/saveBookmark.ts` |
| Konfiguration | `src/lib/config.ts` (`DEFAULT_SERVER_BASE_URL`: `http://localhost:3777`) |

**Extension-Regeln**

- Nutzt **nur** die HTTP-API — keine Backend-Duplikation.
- Server-URL: Desktop/Dev **`http://localhost:3777`** (≈ `127.0.0.1:3777`).
- Side-Load only im MVP (Release-Zip von GitHub); In-App-Anleitung unter `/extension`.

```bash
cd extension && npm install && npm run build
cd extension && npm run test && npm run typecheck
```

**Wichtig:** Domain wirft **keine** `createError`-HTTP-Fehler — nur `BookmarkDomainError`. HTTP-Mapping in `server/utils/http/`.

**Env:** `APP_PORT=3777`, `DATABASE_PATH` (Web-Dev: `./data/bookmarks.db` in `.env`; Desktop setzt absoluten Pfad). `runtimeConfig.public.isDesktop` ist im Client-Build oft `false` — Desktop-Erkennung: API `isDesktop`, Preload `isDesktopShell`, `window.__OPEN_BOOKMARK_DESKTOP__` (Nitro-Plugin `server/plugins/desktop-public-config.ts`).

## UI-Regeln

- **Nuxt UI** — Theming `app/app.config.ts`
- Formulare: `BookmarkFormFields` + `useBookmarkForm`; Fehler: `extractFetchError`
- Add: `BookmarkAddModal` | Edit: `BookmarkEditModal`
- Tags/Listen administrieren: `app/pages/settings.vue`

## Datenbank

Tabellen: `bookmarks`, `tags`, `bookmark_tags`, `lists`, `list_bookmarks`. Duplikate über `normalized_url`. Leere Notizen als `null`.

**Admin-API:** `GET /api/database`, `GET /api/database/backup` (SQL-Dump), `POST /api/database/import` (überschreibt DB). **HTML-Import:** `POST /api/bookmarks/import-html`, Parser `shared/lib/parseBookmarkExportHtml.ts`. Utils: `databaseInfo.ts`, `databaseDump.ts`, `databaseImport.ts`; CLI `open-bookmark/scripts/import-database.mjs`. Desktop-Import: IPC `desktop:importDatabase` (Runtime stoppen → Child-`node` mit Nitro-Node-Binary → Neustart; **nicht** `better-sqlite3` im Electron-Prozess).

## API

Vollständige Spezifikation: [`README.md` § API](README.md#api). Kurzüberblick:

| Methode | Pfad | Extension |
|---------|------|-----------|
| GET | `/api/bookmarks` | Duplikat-Suche, Listen |
| GET | `/api/bookmarks/revision` | — (Web: Auto-Sync) |
| POST | `/api/bookmarks` | Speichern (einzeln) |
| POST | `/api/bookmarks/import-html` | HTML-Export importieren |
| PATCH | `/api/bookmarks/:id` | Tags/Notizen |
| DELETE | `/api/bookmarks/:id` | — |
| POST | `/api/bookmarks/:id/refresh` | Metadaten neu laden |
| GET | `/api/tags` | Vorschläge, Health |
| POST/PATCH/DELETE | `/api/tags`, `/api/tags/:id` | — |
| GET/POST | `/api/lists` | Listen laden |
| GET/PATCH/DELETE | `/api/lists/:id` | Bookmarks zu Liste (`PATCH` `addBookmarkIds`) |
| GET | `/api/database`, `/api/database/backup` | — (Desktop-UI Einstellungen) |

Query bei `GET /api/bookmarks`: `search`, `page`, `pageSize`, `tag`, `list`.

## Entwicklung

**Web-App**

```bash
cd open-bookmark && npm install && npm run dev
npm run typecheck && npm run test
```

**Desktop** (vorher `open-bookmark` Dev auf 3777 beenden)

```bash
cd open-bookmark && npm run build
cd desktop && npm install && npm run dev   # startet Open Bookmark.app
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
