# Sicherheitsrichtlinie

Open Bookmark ist eine **local-first**-Anwendung für einen einzelnen Nutzer. Es gibt keine Authentifizierung; die HTTP-API ist nur für **Loopback** (`127.0.0.1`) vorgesehen.

## Unterstützte Versionen

| Version | Unterstützt |
| ------- | ----------- |
| 1.0.x   | Ja          |
| < 1.0   | Nein        |

## Schwachstellen melden

Bitte melde Sicherheitsprobleme **vertraulich** (kein öffentliches Issue mit Exploit-Details):

- **Private** Security Advisory auf GitHub erstellen, oder
- Den Maintainer über die Kontaktdaten im Repository-Profil erreichen.

Bitte Schritte zur Reproduktion, Auswirkung und betroffene Version angeben.

## Hinweise zum Geltungsbereich

- Die Chrome Extension spricht nur mit der vom Nutzer konfigurierten Open-Bookmark-Server-URL.
- Der SQL-Import prüft Dump-Inhalte; importiere keine SQL-Dateien aus unbekannten Quellen.
- Unsigned macOS-Builds erfordern eine ausdrückliche Freigabe in Gatekeeper.
