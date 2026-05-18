# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-05-18

### Added

- **Extension-Installation:** Anleitung zum Laden der Release-ZIP von [GitHub Releases](https://github.com/emelpe78/open-bookmark/releases) (App `/extension`, Onboarding, README); Shortcuts „Releases öffnen“ und „Chrome-Erweiterungen öffnen“.
- **Release-Dokumentation:** `docs/GitHub_Release.md` (Tag setzen, Gatekeeper-Hinweis nach Download).
- **CODEOWNERS:** `.github/CODEOWNERS` für Review-Pflicht auf `main`.
- **Paket-Metadaten:** `description`, `author`, `license`, `repository`, `bugs`, `keywords` und `engines` in `open-bookmark/`, `extension/` und `desktop/package.json`.

### Changed

- **README:** Einleitung beschreibt Desktop, Extension und local-first klarer; Gatekeeper-Hinweis mit `xattr -cr` für Release-Downloads.
- **GitHub Actions:** `actions/checkout@v5`, `actions/setup-node@v5`, `softprops/action-gh-release@v3` (Node-24-Runtime, keine Deprecation-Warnung mehr).
- **Desktop-Packaging:** `npm run pack` signiert die `.app` ad-hoc und baut das DMG aus dem signierten Bundle (`pack:release`).

### Fixed

- **Release-DMG:** Ad-hoc-Signatur für eingebettete Mach-O-Dateien (Node, native Module) — behebt macOS-Meldung „ist beschädigt“ nach Browser-Download.
- **CI Desktop:** Icon-Generierung ohne `docs/favicon.png` (Fallback auf `desktop/resources/icon.png`).
- **CI Extension:** `extension/scripts/generate-icons.*` wird nicht mehr von `.gitignore` ausgeschlossen.
- **Typecheck:** `vue-router` auf v5 angehoben (Volar-Plugin `vue-router/volar/sfc-route-blocks` mit Nuxt 4).
- **CHANGELOG:** Release-Links zeigen auf `emelpe78/open-bookmark`.

## [1.0.0] - 2026-05-18

### Added

- **HTML-Import:** Chrome/Netscape `bookmarks.html` in Einstellungen importieren (`POST /api/bookmarks/import-html`).
- **Datenbank-Verwaltung:** Pfad anzeigen/ändern (Desktop), SQL-Backup und SQL-Import, Finder-Integration.
- **Open Bookmark Desktop (macOS):** Electron-Shell mit eingebetteter Nitro-Runtime auf `127.0.0.1:3777`.
- **Chrome Extension (MV3):** Seite speichern, Duplikat-Erkennung, Tags, Kontextmenü, Verbindungstest.
- Lesezeichen mit Metadaten-Extraktion, Tags, Listen, Markdown-Notizen, Suche und Bulk-URL-Import.

### Changed

- Erste stabile Release-Version; Desktop und Extension auf `1.0.0`.

### Notes

- macOS-Builds in GitHub Releases sind **unsigned Developer Builds** (Gatekeeper-Hinweis in README).
- Code-Signing und Notarisierung sind für eine spätere Version geplant.
- Bundle-ID: `app.openbookmark.desktop` (siehe [docs/adr/0001-app-bundle-id.md](docs/adr/0001-app-bundle-id.md)); Nutzerdaten bleiben unter `~/Library/Application Support/Open Bookmark/`.
- SQLite-Schema-Version (`PRAGMA user_version`) wird ab 1.0.0 auf Version 1 gesetzt; künftige Migrationen laufen über `schemaMigrations.ts`.

## [0.4.0] - (vor 1.0.0)

- Datenbank-Einstellungen, SQL-Backup, Desktop-Preferences und Pfadwechsel.

[1.0.1]: https://github.com/emelpe78/open-bookmark/releases/tag/v1.0.1
[1.0.0]: https://github.com/emelpe78/open-bookmark/releases/tag/v1.0.0
[0.4.0]: https://github.com/emelpe78/open-bookmark/releases/tag/v0.4.0
