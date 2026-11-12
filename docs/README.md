# Dokumentation des Guben Cockpits

Stand: 12. November 2026. Die folgenden Betriebs- und Architekturtexte wurden mit dem Repository-Stand `dev` bei `1a15a84` abgeglichen. Dieser Abgleich ersetzt keine Pruefung der laufenden Produktionsumgebung.

| Einstieg | Inhalt |
| --- | --- |
| [Inhaltsquellen und Abrufwege](content-sources.md) | Zentrale Übersicht: internes Gateway, SVA Mainserver, lokale Daten und externe Dienste |
| [Repository-README](../README.md) | Komponenten, Installation, lokaler Start und Verifikation |
| [Systemdokumentation](system-documentation.md) | Kompakte Laufzeit- und Quellenuebersicht |
| [arc42](arc42.md) | Architektur, Systemgrenzen, Entscheidungen und Risiken |
| [Content-Gateway-API](content-gateway-api.md) | Endpunkte, Parameter, Antworten und Fehler |
| [Automatische Inhaltsuebersetzung](automatic-content-translation.md) | Sprach-Fallback, Hintergrundauftraege und Cache |
| [Release-Verfahren](releases.md) | Branches, Tags, Images, GitHub Releases und Freigabestand |
| [Deploy-Runbook](deploy-runbook.md) | Portainer, Versionswerte, Smoke-Tests, Logs und Rollback |
| [Gateway-Rollout](public-content-gateway-rollout.md) | Erstinbetriebnahme, lokale Compose-Konfiguration und Monitoring |
| [PostgREST](../postgrest/README.md) | Datenbankvoraussetzungen, Bootstrap und Berechtigungspruefung |

## Fachliche Integrationen und Betriebsaenderungen

- [SVA-Mainserver-POIs](smart-village-poi-read-contract.md)
- [SVA-Mainserver-Featured-Projects](smart-village-featured-project-read-contract.md)
- [Event-HTTP-Status](event-detail-http-status.md)
- [Alte Projektlinks](legacy-project-links.md)
- [Stilllegung der alten .NET-API](legacy-api-retirement.md)

Die speziellen Rollout-Abschnitte dieser Dokumente beschreiben begrenzte Aenderungen und zugehoerige Images. Fuer einen normalen Release gilt das aktuelle Deploy-Runbook.

## Historische Unterlagen und Spezifikationen

Datierte `issue-*`- und `sonar-*`-Berichte sowie `superpowers/` dokumentieren Untersuchungen und Entwurfsstaende zu ihrem jeweiligen Datum. Sie sind keine aktuelle Betriebsanleitung. Umgesetzte OpenSpec-Aenderungen liegen unter `openspec/changes/archive/`; die Spezifikationen unter `openspec/specs/` beschreiben die vereinbarten Vertraege. Ein offener Entwurf unter `openspec/changes/` belegt fuer sich keine Umsetzung oder Auslieferung.
