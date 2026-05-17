---
name: rename-project
description: Renames the template Nuxt app folder (default boilerplate) to a new project slug and reconciles every repo reference—.gitignore prefixes, docs, package.json and lockfile root names, CONTEXT title, and stray path strings. Use when the user invokes `/rename-project <slug>`, renames the boilerplate directory for a new project, or asks to align paths and npm name with a new app folder name.
---

# rename-project

Slash-style trigger: **`/rename-project <slug> [from-folder]`**

- **`<slug>`** — target kebab-case identifier (e.g. `test-app`). Used for the **directory name** and **`package.json` / lockfile `name`**.
- **`[from-folder]`** — optional; defaults to **`boilerplate`**. Use if the app directory was already renamed once.

## Quick start

```
/rename-project shop-frontend
```

1. Validate `slug` (lowercase, `[a-z0-9-]+`, no `.` or `..`, not empty).
2. If `from-folder` ≠ `slug`, rename directory: `git mv <from-folder> <slug>` (or `mv` if not a git checkout).
3. Update every **text** reference per [Search surface](#search-surface).
4. **`rg` sanity check** from repo root — no remaining `from-folder` path segments, no old npm `name` in scope (excluding `node_modules`, `.nuxt`, `.output`, `.git`, `.agents`, `.claude`, `.cursor`).

## Search surface (always check)

| Location | What to change |
|----------|----------------|
| Root **`.gitignore`** | Lines `from-folder/...` → `slug/...` |
| **`docs/agents/domain.md`** | Tree / path mentions of the app folder |
| **`<slug>/package.json`** | `"name": "<slug>"` |
| **`<slug>/package-lock.json`** | Only **root** package id: top-level `"name"` and `"packages"."": { "name" }`. Never replace other `"name"` entries. |
| **`CONTEXT.md`** | Heading / intro if still template wording (`nuxt-4-boilerplate` etc.) |
| **Rest of repo** | `rg '<from-folder>|old-package-name'` on tracked text; fix in-scope hits |

## Workflow

- [ ] Confirm `from-folder` exists and contains `nuxt.config.ts`.
- [ ] Read **old** `"name"` from `<from-folder>/package.json` before renaming.
- [ ] Rename folder; replace path prefix **`from-folder/`** with **`slug/`** where it denotes this app.
- [ ] Set npm **`name`** to **`slug`**; patch lockfile roots only.
- [ ] Replace old **logical** template name in docs/CONTEXT where it named the repo template, not dependencies.
- [ ] **Do not** bulk-edit **`package-lock.json`** nested package names.
- [ ] **`npm install`** under `<slug>/` only if lockfile needs regeneration.
- [ ] **`npm run build`** in `<slug>/` before done.

## Out of scope

- Git remote rename; history beyond **`git mv`**.
- **`nuxt.config`** unless it literally embeds the old folder string (unlikely).
- **`node_modules`**, **`.nuxt`**, **`.output`**.

## Gotchas

- Prefer path-shaped matches (`boilerplate/`) so unrelated words are not altered.
- If **`from-folder` = `slug`**: no-op paths; still align **`package.json` `name`** if user asks.
- Clear **`node_modules/.cache`** if tools still show stale paths after rename.
