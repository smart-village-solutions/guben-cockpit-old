## Why

Das Content Gateway erfuellt seinen Zweck als technische Grenze zwischen Frontend und Datenquellen, ist in der aktuellen Form aber architektonisch uneinheitlich. Der Branch dokumentiert heute einen PostgREST-zentrierten Runtime-Pfad, waehrend der Gateway-Code noch ungenutzte CMS-Konfiguration, doppelte Contract-Definitionen, fehlende Rollout-Kontrolle und zu breit geschnittene Repository-Logik enthaelt.

Die naechsten Schritte sollen diese Differenzen aufloesen, damit das Gateway als stabile, wartbare Boundary weiterentwickelt werden kann. Das ist jetzt sinnvoll, weil der erste Gateway-Change abgeschlossen ist und die Folgearbeiten vor weiterer Feature-Entwicklung deutlich guenstiger sind als spaetere Nacharbeiten unter Last.

## What Changes

- Die Umsetzung erfolgt phasenweise: zuerst Test- und Contract-Absicherung, danach Source-Policy und shared contracts, zuletzt interner Refactor, Rollout-Steuerung und Observability-Anpassungen.
- Der aktive Upstream- und Konfigurationspfad des Content Gateway wird an die dokumentierte Runtime-Architektur angeglichen.
- Die Gateway-Vertragsdefinitionen fuer public content werden in eine gemeinsame Quelle ueberfuehrt, die von Gateway, Frontend und Contract-Checks gemeinsam genutzt wird.
- Das Frontend erhaelt eine explizite Rollout- und Fallback-Steuerung fuer Gateway-basierte Public-Content-Pfade.
- Das Gateway erhaelt belastbarere Readiness-/Observability-Bausteine fuer Betrieb und Alerting.
- Die interne Gateway-Struktur wird entlang klarer Verantwortlichkeiten refaktoriert, damit Upstream-Zugriff, Mapping, Endpoint-Komposition und Query-Logik getrennt weiterentwickelt werden koennen.

## Capabilities

### New Capabilities
- `content-gateway-source-policy`: Das Gateway bildet die tatsaechlich unterstuetzten Runtime-Quellen explizit ab und verlangt nur die Konfiguration, die fuer den aktiven Betriebsmodus benoetigt wird.
- `shared-public-content-contracts`: Public-Content-Vertraege werden an einer Stelle definiert und von Gateway, Frontend und Verifikationsskripten gemeinsam verwendet.
- `public-content-rollout-control`: Gateway-basierte Public-Content-Pfade koennen kontrolliert aktiviert, deaktiviert und fuer Rollbacks auf einen definierten Disabled-State zurueckgestellt werden.
- `content-gateway-readiness-observability`: Gateway-Betrieb stellt aussagekraeftige Readiness- und Metrik-Signale bereit, die fuer Monitoring und Alerting taugen.

### Modified Capabilities

## Impact

- `content-gateway/` fuer Konfiguration, Upstream-Anbindung, Modulzuschnitt, Health- und Metrics-Verhalten
- `frontend/` fuer Contract-Nutzung, Public-Content-Datenquellen und Rollout-Fallback
- `docs/` fuer System- und Rollout-Dokumentation
- `openspec/` fuer die neuen Anforderungen und Umsetzungsaufgaben
- CI-Checks und Test-Suiten fuer Contract-Drift, Charakterisierungstests und Rollout-Absicherung
