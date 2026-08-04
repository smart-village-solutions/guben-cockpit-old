## Context

Der Branch betreibt heute einen Public-Content-Stack aus `frontend/`, `content-gateway/` und `postgrest/`. Die Systemdokumentation beschreibt einen PostgREST-zentrierten Runtime-Pfad ohne aktiven `.NET`- oder CMS-Backend-Anteil, waehrend das Gateway noch aus der ersten Migrationsphase stammt und mehrere Uebergangsmerkmale enthaelt:

- verpflichtende, aber ungenutzte CMS-Konfiguration im Gateway
- doppelt gepflegte Public-Content-Contracts in Gateway und Frontend
- harte Gateway-Aktivierung im Frontend ohne deaktivierbaren Rollout-Pfad
- breite Repository-Klasse mit Datenzugriff, Komposition, Mapping, Filterung und SEO-Aufbereitung
- Metrik-Erfassung mit ungebundenem In-Memory-Wachstum und ohne belastbare Latenz-Buckets

Die Folgeaenderung soll diese Uebergangsarchitektur in eine klarer geschnittene Zielarchitektur ueberfuehren, ohne die bestehenden `/api/content/*`-HTTP-Vertraege aufzubrechen.

## Goals / Non-Goals

**Goals:**
- Die Umsetzung in eine Reihenfolge bringen, die bestehendes Verhalten zuerst absichert und risikoreiche Refactors erst spaeter freischaltet.
- Die dokumentierte Runtime-Architektur und die effektive Gateway-Konfiguration angleichen.
- Public-Content-Contracts als gemeinsame Quelle fuer Gateway, Frontend und Verifikationsskripte etablieren.
- Den Frontend-Einsatz des Gateway ueber eine explizite Aktivierungssteuerung kontrollierbar machen.
- Betriebsrelevante Health- und Metrik-Signale auf ein belastbares Minimum anheben.
- Die interne Gateway-Struktur so schneiden, dass Upstream-Zugriff, Mapping und Endpoint-Komposition getrennt weiterentwickelt werden koennen.

**Non-Goals:**
- Ein kompletter Neuaufbau der Public-Content-Domain oder eine Aenderung der bestehenden REST-Endpunkte.
- Eine Rueckkehr zu einem direkten Browser-Zugriff auf Datenbanken oder externe CMS-Systeme.
- Neue fachliche Inhalte fuer Home, Events, Projects oder Map.
- Eine generische Plattform fuer beliebige weitere Gateway-Domaenen ausserhalb des Public-Content-Pfads.

## Decisions

### 1. Vor riskanten Refactors wird ein Kompatibilitaets-Sicherheitsnetz aufgebaut

Der Change wird in Phasen umgesetzt. Vor jeder strukturellen Aenderung am Gateway muessen die bestehende Gateway-Testbasis repariert und Characterization-Tests fuer Contracts, Fehlerhuellen und Source-Mode-Startverhalten ergaenzt werden.

Rationale:
- Senkt das reale Regressionsrisiko der spaeteren Modulaufteilung deutlich.
- Macht unerwuenschte Verhaltensaenderungen frueh sichtbar.
- Ermoeglicht kleinere, reviewbare Pull Requests statt eines grossen Architektur-Sprungs.

Alternatives considered:
- Alles in einem groesseren Refactor umsetzen: verworfen, weil die aktuelle Testbasis dafuer nicht stabil genug ist.
- Erst refaktorisieren und danach Tests nachziehen: verworfen, weil genau die kritischen Unterschiede dann schwerer nachweisbar waeren.

### 2. Runtime-Quellen explizit auf `mock` und `postgrest` begrenzen

Das Gateway behaelt nur die tatsaechlich betriebenen Source-Modes `mock` und `postgrest`. Startup-Validierung, Health-Ausgabe und Dokumentation muessen sich an diesem Satz orientieren. CMS-spezifische Runtime-Konfiguration ist in diesem Branch nicht mehr verpflichtend.

Rationale:
- Entfernt irrefuehrende Konfiguration und nicht verdrahtete Architekturteile.
- Vereinfacht Deployments, Health-Checks und lokale Entwicklung.
- Erzwingt eine bewusste neue Design-Entscheidung, falls spaeter wieder ein CMS-Upstream eingefuehrt werden soll.

Alternatives considered:
- Bestehende CMS-Variablen als inaktive Altlast stehen lassen: verworfen, weil dies Betrieb und Wartung irrefuehrend macht.
- Sofort einen hybriden CMS/PostgREST-Modus implementieren: verworfen, weil die aktuelle Branch-Architektur das nicht benoetigt und die Komplexitaet ohne Nutzwert erhoeht.

### 3. Das Gateway intern in Source-Adapter, Mapper und Composer schneiden

Die aktuellen Endpoint-Methoden werden in kleinere Bausteine zerlegt:

- Route-/HTTP-Schicht: Validierung, Sprache, Fehleruebersetzung
- Query-/Source-Adapter: PostgREST-Zugriffe je Ressource oder Aggregat
- Mapper: Umwandlung von Upstream-Daten in Contract-Modelle
- Composer/Application Services: endpoint-spezifische Zusammensetzung, Filterung und Pagination

Rationale:
- Macht Verantwortlichkeiten testbar und reduziert die Kopplung innerhalb einer einzelnen Repository-Klasse.
- Erleichtert spaetere Aenderungen an Datenquellen oder Vertragsmodellen.
- Verhindert, dass immer mehr fachnahe Logik an einer zentralen Datei klebt.

Alternatives considered:
- Die bestehende Repository-Klasse nur kosmetisch aufraeumen: verworfen, weil die strukturelle Ueberladung bestehen bliebe.
- Mehr Logik direkt in PostgREST-Views verschieben: nur teilweise geeignet, weil Contract-Mapping, SEO und Error-Normalisierung Gateway-Aufgaben bleiben.

### 4. Public-Content-Contracts in ein gemeinsames Modul ueberfuehren

Die Zod-Schemas und Typen fuer Public-Content-Vertraege werden an einer Stelle gepflegt und von Gateway, Frontend und Contract-Checks importiert. Die gemeinsame Quelle liegt im Repository als shared Modul oder Package und wird ohne Code-Kopie verwendet.

Rationale:
- Verhindert Contract-Drift zwischen Backend und Frontend.
- Macht Contract-Aenderungen in Reviews und CI eindeutig sichtbar.
- Reduziert die Kosten fuer zusaetzliche Endpunkte oder Vertragsaenderungen.

Alternatives considered:
- Contracts in beiden Projekten parallel pflegen und per Skript vergleichen: verworfen, weil die Drift-Quelle bestehen bleibt.
- Types nur aus dem Gateway generieren und im Frontend ohne Zod-Validierung nutzen: verworfen, weil die Laufzeitvalidierung im Frontend explizit erhalten bleiben soll.

### 5. Frontend-Rollout ueber Source-Resolver und Disabled-State steuern

Das Frontend bekommt eine explizite Source-Steuerung fuer Public-Content-Routen. Wenn Gateway-Content deaktiviert ist, duerfen diese Routen keine Gateway-Requests ausloesen und muessen einen definierten Disabled-State rendern. Der Default fuer Produktionsdeployments bleibt Gateway-aktiviert, die Steuerung erfolgt aber per Konfiguration statt hart im Code.

Rationale:
- Ermoeglicht kontrollierte Aktivierung und schnelle Ruecknahme ohne Codeaenderung.
- Passt zur aktuellen Branch-Realitaet ohne nicht mehr vorhandenen Alt-Backend-Pfad.
- Macht Rollout-Entscheidungen in Betrieb und Tests explizit.

Alternatives considered:
- Gateway-Aufrufe fest eingebaut lassen: verworfen, weil dies Rollback und Staging unnoetig erschwert.
- Einen frueheren Legacy-Datenpfad wieder einbauen: verworfen, weil dieser Branch bewusst auf den Public-Content-Stack reduziert wurde.

### 6. Health und Metriken auf Readiness und Alerting ausrichten

Das Gateway behaelt einen einfachen Liveness-Endpunkt, ergaenzt aber Readiness-Information fuer den aktiven Source-Mode. Request-Latenzen werden mit begrenzten, Prometheus-tauglichen Buckets oder Histogramm-Metriken erfasst statt mit ungebundener In-Memory-Speicherung einzelner Dauerwerte.

Rationale:
- Unterstuetzt die in den Betriebsdokumenten beschriebenen Alerts.
- Verhindert stetiges Speicherwachstum durch Request-Historien.
- Macht Deploy- und Incident-Verhalten klarer.

Alternatives considered:
- Die vorhandene Metrik-Implementierung beibehalten: verworfen, weil sie fuer laenger laufende Prozesse und p95-Auswertungen nicht robust genug ist.
- Volle externe Observability-Integration im selben Change: verworfen, weil ein kleines, belastbares Prometheus-kompatibles Minimum ausreicht.

## Risks / Trade-offs

- [Die aktuelle Testbasis ist bereits vor dem Refactor nicht voll belastbar] -> Mitigation: den Change mit Testreparatur und Characterization-Tests beginnen, bevor strukturelle Umbauten erfolgen.
- [Interne Refaktorierung ohne API-Aenderung ist fehleranfaellig] -> Mitigation: Endpunktverhalten ueber bestehende und erweiterte Contract-Tests absichern.
- [Shared Contracts koennen Build- und Tooling-Aufwand erhoehen] -> Mitigation: ein sehr kleines shared Modul ohne neue Laufzeitplattform einfuehren.
- [Disabled-State im Frontend kann Inhalte absichtlich abschalten] -> Mitigation: produktive Default-Konfiguration weiterhin auf Gateway aktiv setzen und die Umschaltung nur als Betriebswerkzeug nutzen.
- [Readiness-Pruefungen koennen Upstream-Probleme sichtbarer machen] -> Mitigation: Liveness und Readiness trennen und nur erforderliche Checks fuer den aktiven Source-Mode ausfuehren.
- [Aufraeumen der CMS-Reste erschwert spaetere Wiedereinfuehrung] -> Mitigation: bei kuenftigem CMS-Bedarf einen expliziten neuen Change mit eigener Source-Policy anlegen.

## Migration Plan

1. Die bestehende Gateway-Testbasis reparieren und Characterization-Tests fuer die aktuellen `/api/content/*`-Vertraege, Fehlerantworten und Source-Modes einfuehren.
2. Shared Public-Content-Contracts anlegen und Gateway sowie Frontend darauf umstellen.
3. Gateway-Konfiguration und Startup-Validierung auf die unterstuetzten Source-Modes reduzieren.
4. Die monolithische Repository-Logik hinter unveraenderten HTTP-Endpunkten in kleinere Module zerlegen.
5. Frontend-Source-Resolver und Disabled-State einfuehren und per Umgebungsvariable steuerbar machen.
6. Health- und Metrics-Verhalten so umstellen, dass Alerts und laenger laufender Betrieb abgesichert sind.
7. System- und Rollout-Dokumentation an die bereinigte Architektur anpassen.

Rollback strategy:
- Frontend-Rollout per Konfiguration auf Disabled-State zurueckstellen, falls Gateway-Verhalten regressiert.
- Bei Gateway-Problemen das zuletzt stabile Image erneut deployen; die REST-Endpunkte bleiben kompatibel.
- Shared-Contract-Einfuehrung zuerst kompatibel halten, damit ein Rollback von Gateway oder Frontend einzeln moeglich bleibt.

## Open Questions

- Soll Readiness unter `/health` erweitert werden oder als separater Endpunkt wie `/health/ready` erscheinen?
- Soll das shared Contract-Modul unter `frontend/`/`content-gateway/` verlinkt werden oder als eigenes Top-Level-Package im Repository liegen?
- Reicht ein globaler Public-Content-Toggle im Frontend oder wird route-granulare Aktivierung benoetigt?
