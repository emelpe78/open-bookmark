# AGENTS.md

## Purpose
This repository contains **Open-Bookmark**, a local-first, Dockerized bookmark manager.

The app stores URLs in a SQLite database, enriches them with metadata fetched from the target page, and displays them in a searchable, paginated card-based UI.

This file explains the project for AI coding agents so they can contribute safely and consistently.

## Product Summary
Open-Bookmark is:
- a self-hosted bookmark app
- local-first
- intended to be open source on GitHub
- designed for single-user local usage
- intentionally **without auth** in the MVP
- intentionally **without LLM features** in the MVP

Core features:
- add/edit/delete bookmarks
- extract metadata from URLs
- display bookmarks as cards
- search bookmarks
- paginate bookmark lists
- assign tags
- write notes in Markdown
- run locally via Docker

## Tech Stack
- **Framework:** Nuxt 4
- **UI:** Nuxt UI
- **Icons:** Nuxt Icon (`@nuxt/icon`)
- **Backend:** Nitro server routes
- **Database:** SQLite via `better-sqlite3`
- **HTML parsing:** Cheerio
- **Containerization:** Docker

## Non-Goals for MVP
Agents must not introduce these unless explicitly requested:
- authentication
- user accounts
- local LLM integration
- Playwright or browser automation
- background crawling
- scheduler/cron jobs
- cloud-only architecture
- external database requirement

## High-Level Architecture
The app should be implemented as a standard Nuxt application with:
- pages for the UI
- server API routes for bookmark operations
- a SQLite database file stored outside the repo data path
- metadata extraction on demand when a bookmark is created or manually refreshed

Suggested logical areas:
- `pages/` for views
- `components/` for Nuxt UI based components
- `server/api/` for API routes
- `server/utils/` for database helpers, URL normalization, metadata extraction
- `app.config.ts` for Nuxt UI theming/tokens

## UI Guidelines
Use **Nuxt UI components** instead of hand-rolled styling.

Preferred components:
- `UCard` for bookmark cards
- `UButton` for actions
- `UInput` for URL/search inputs
- `UModal` or `USlideover` for create/edit flows
- `UBadge` for tags
- `UPagination` for pagination
- `UTextarea` or suitable editor wrapper for Markdown notes

Important:
- Do **not** author the app as a Tailwind-first project.
- Avoid custom styling unless necessary.
- Prefer Nuxt UI primitives and configuration through `app.config.ts`.

## Default Runtime Configuration
Use environment variables.

Expected defaults:
- `APP_PORT=3777`
- `DATABASE_PATH=/data/bookmarks.db`

The app should avoid common default ports like `3000`.
Port `3777` is preferred to reduce collisions with other local tools.

## Database Rules
The SQLite database must be created automatically if it does not exist.

Expected tables:
- `bookmarks`
- `tags`
- `bookmark_tags`

### bookmarks
Expected fields:
- `id`
- `url`
- `normalized_url`
- `title`
- `description`
- `image_url`
- `site_name`
- `notes`
- `created_at`
- `updated_at`

### tags
Expected fields:
- `id`
- `name`

### bookmark_tags
Expected fields:
- `bookmark_id`
- `tag_id`

General DB rules:
- initialize schema on startup
- keep schema simple
- prefer direct SQL over adding unnecessary abstraction
- prevent duplicate bookmarks through `normalized_url`

## Bookmark Ingestion Flow
When a new bookmark is created:
1. validate the URL
2. normalize the URL
3. fetch the page server-side
4. parse metadata with Cheerio
5. extract at least:
   - title
   - description
   - image URL
   - site name
6. store the bookmark in SQLite
7. optionally associate tags




## Edit Bookmark Modal
Existing bookmarks are edited exclusively through an **edit modal**.

- Triggered by an "Bearbeiten" button on the bookmark card or detail view.
- Contains the same fields as the "Einzeln" tab in the Add Modal: URL, notes (Markdown), tags.
- If the URL is changed, metadata must be re-fetched automatically after saving.
- Changes are only persisted on explicit save — no auto-save.
- Modal closes automatically on successful save.
- Validation errors are shown inline.
- Use `UModal`, `UInput`, `UForm`, `UButton` from Nuxt UI.

### Rules for Agents
- Do not implement inline editing on cards or detail views.
- The edit modal is the single entry point for modifying a bookmark.
- Do not reuse the Add Modal for editing — use a dedicated edit modal component.

## Markdown Notes Editor
Notes are stored as raw Markdown and rendered contextually.

### In Add Modal (Tab "Einzeln") and Edit Modal
- Render a `UTextarea` for Markdown input — no WYSIWYG editor.
- Above the textarea, show two toggle buttons or tabs: **"Bearbeiten"** and **"Vorschau"**.
- **"Bearbeiten" mode**: plain textarea, editable.
- **"Vorschau" mode**: rendered HTML from the current Markdown content, read-only.
- Switching between modes must not lose unsaved content.
- Default mode on modal open: **"Bearbeiten"**.

### In Bookmark Detail / Card View
- Notes are displayed as **rendered Markdown** (formatted HTML) by default.
- No inline editing — editing is always triggered via the edit modal.
- Use `@nuxtjs/mdc` or `marked` + `DOMPurify` for rendering.

### Rules for Agents
- Always sanitize rendered Markdown output with DOMPurify or equivalent — XSS protection is mandatory.
- Always store raw Markdown text in the database, never rendered HTML.
- Store empty notes as `null`, not as an empty string `""`.
- Do not implement a full WYSIWYG toolbar — a plain textarea with preview toggle is sufficient.

## Add Bookmark Modal
New bookmarks are created exclusively through a **modal dialog**.

The modal contains two tabs:

### Tab: "Einzeln" (Single)
- One URL input field.
- Optional fields: notes (Markdown), tags.
- On save: metadata is fetched automatically server-side.
- Modal closes automatically on success.
- Validation errors are shown inline.

### Tab: "Liste" (Bulk)
- A single input or textarea accepting a comma-separated list of URLs.
- No notes or tag fields on this tab — those can be edited per bookmark after import.
- On save: each URL is processed individually through the full ingestion flow.
- Modal stays open after import and shows a result summary (created / skipped / failed).
- User must explicitly close the modal after reviewing the summary.

### UI Components to use
- `UModal` for the modal container
- `UTabs` for the tab switcher
- `UInput` for single URL input
- `UTextarea` for the bulk URL list
- `UButton` for submit and close actions
- `UBadge` for result summary counts
- `UFormGroup` or `UForm` for field layout and validation

### Rules for Agents
- Do not implement separate pages or routes for adding bookmarks.
- The modal is the single entry point for creating bookmarks.
- Tab state does not persist between modal opens — always default to the "Einzeln" tab.
- Do not add notes or tag fields to the "Liste" tab.

## Bulk URL Import
The app supports adding multiple bookmarks at once via a comma-separated list of URLs.

Agents must implement this as follows:
- The URL input field accepts either a single URL or a comma-separated list.
- The server-side handler splits the input by comma, trims whitespace from each entry, and processes each URL individually.
- Each URL goes through the full ingestion flow: validation → normalization → metadata fetch → storage.
- Duplicate URLs (matched via `normalized_url`) are silently skipped, not rejected with an error.
- The API response for a bulk import must include a summary:
  - `created`: number of successfully added bookmarks
  - `skipped`: number of duplicates
  - `failed`: list of URLs that could not be processed, with a reason

Agents must not treat bulk import as a separate endpoint.
The existing `POST /api/bookmarks` endpoint should handle both single and bulk input transparently.

Example request body for bulk import:
```json
{
  "urls": "https://example.com, https://another.com, https://third.com"
}
```

Example response:
```json
{
  "created": 2,
  "skipped": 1,
  "failed": []
}
```

## Search and Pagination
Agents should preserve these product requirements:
- bookmarks must be searchable
- bookmark lists must support pagination
- cards must show available metadata and a small preview image

Search should target at least:
- URL
- title
- description
- notes
- optionally tag names

For MVP, simple SQL search is acceptable.
Do not add FTS unless explicitly requested.

## URL Normalization Rules
Agents should normalize URLs consistently to reduce duplicates.
Recommended behavior:
- lowercase hostname
- remove tracking parameters such as `utm_*`
- normalize trailing slashes where reasonable
- preserve meaningful path/query information

Do not over-normalize in ways that break distinct URLs.

## Markdown Notes
Notes are stored as Markdown text.
Agents should:
- store raw Markdown in the database
- render Markdown safely in the UI
- avoid unsafe HTML rendering by default

## API Expectations
Suggested API surface:
- `GET /api/bookmarks`
- `POST /api/bookmarks`
- `PATCH /api/bookmarks/:id`
- `DELETE /api/bookmarks/:id`
- `GET /api/tags`
- `POST /api/bookmarks/:id/refresh`

Agents may refine request/response shapes, but should not drift from the product scope without explicit approval.

## Docker and Local Development
The app is meant to run locally in Docker.

Requirements:
- use a persistent volume for `/data`
- keep the SQLite file out of version control
- ensure the app works with a single local startup flow

Example runtime expectation:
```bash
docker run -p 3777:3777 -v openbookmark_data:/data open-bookmark
```

## Open Source and Security Rules
This repository is intended to become public.
Agents must treat this as a hard requirement.

Never commit:
- `.env`
- SQLite database files
- API keys
- tokens
- passwords
- private local paths
- user data

Required repo hygiene:
- `.env` must be in `.gitignore`
- database files such as `*.db` must be in `.gitignore`
- provide a `.env.example` with safe placeholder values only
- assume all commits may later become public

If an agent generates config examples, they must contain **no sensitive data**.

## Change Management Rules for Agents
Agents should:
- prefer small, incremental changes
- preserve the current stack choices
- avoid adding large dependencies without a clear reason
- avoid introducing auth, background workers, or LLM features unless requested
- keep the repo easy for open-source contributors to understand

Before making significant architectural changes, verify they align with the PRD and the MVP scope.

## Definition of Done
A change is aligned with the project if it:
- supports the bookmark manager use case
- works with SQLite locally
- fits the Nuxt 4 + Nuxt UI + Nuxt Icon stack
- respects Docker/local-first deployment
- keeps secrets and local data out of version control
- does not introduce out-of-scope complexity

## If You Are an AI Agent Working on This Repo
When in doubt:
1. keep things simple
2. optimize for local developer experience
3. prefer explicit code over clever abstractions
4. do not leak secrets into files
5. do not expand the scope without asking
