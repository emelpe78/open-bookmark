# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/emelpe78/open-bookmark/releases/tag/v1.0.0
[0.4.0]: https://github.com/emelpe78/open-bookmark/releases/tag/v0.4.0
