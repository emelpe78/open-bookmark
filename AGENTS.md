# AGENTS.md

Leitfaden für AI-Agents am Projekt **Open-Bookmark** — lokaler Bookmark-Manager (Nuxt 4, SQLite, Docker). Details: [`README.md`](README.md).

## Produkt (MVP)

- Self-hosted, **local-first**, Single-User, **ohne Auth**, **ohne LLM**
- URLs speichern, Metadaten per Server-Fetch (Cheerio), Karten-UI, Suche, Tags, Markdown-Notizen
- Open Source — keine Secrets, keine `.db`-Dateien committen

**Nicht einführen** (ohne explizite Anfrage): Auth, Accounts, Playwright/Crawling, Cron/Worker, externe DB, FTS, Cloud-only.

## Stack & Layout

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

| Methode | Pfad |
|---------|------|
| GET | `/api/bookmarks` |
| POST | `/api/bookmarks` |
| PATCH | `/api/bookmarks/:id` |
| DELETE | `/api/bookmarks/:id` |
| GET | `/api/tags` |
| POST | `/api/bookmarks/:id/refresh` |

## Entwicklung

```bash
cd open-bookmark && npm install && npm run dev
npm run typecheck
npm run test
```

## Sicherheit

Niemals `.env`, `*.db`, Keys committen.

## Definition of Done

- MVP-Scope, SQLite, Nuxt UI, Docker-tauglich, `npm run test` + `typecheck` grün
- Domain ohne HTTP; eine Quelle für Pagination, Tags, Fehlermeldungen
