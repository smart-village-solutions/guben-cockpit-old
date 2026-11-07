# Stilllegung der alten .NET-API

Die alte API `guben-api-prod` wird vom aktuellen Cockpit nicht mehr verwendet.
Das Frontend nutzt das Content-Gateway; dieses liest Smart Village und
PostgREST. Buchungen verwenden einen eigenen Dienst. Der Betreiber hat
bestätigt, dass auch keine externen Aufrufer der alten API mehr existieren.

## Änderung

- Den Dienst `guben-api-prod` aus dem produktiven Stack entfernen.
- Seine ausschließlich dort verwendeten Image-, Datenbankverbindungs-,
  Keycloak- und Nextcloud-Variablen aus der Stack-Umgebung entfernen.
- Den alten Container stoppen und ohne Volume-Löschung entfernen.
- Die ausschließlich auf diesen Container zeigende Weiterleitung
  `api.guben.de` im Nginx Proxy Manager deaktivieren.
- Das nicht mehr eingebundene Data-Protection-Volume für einen Rollback erhalten.
- Die früheren Build-Hilfen unter `ops/archive/legacy-api/` archivieren.

Der aktive Stack besteht danach aus Frontend, Content-Gateway, PostgREST und
PostgreSQL. Diese Container, ihre Konfiguration und alle bestehenden Volumes
bleiben erhalten. Die Keycloak- und Nextcloud-Dienste selbst werden nicht verändert.

Die alten numerischen Projekt-IDs im heutigen Content-Gateway gehören nicht
zur stillgelegten .NET-API. Die bereits produktive Weiterleitung alter
Projektseiten zur Übersicht bleibt erhalten.

## Durchführung und Prüfung

Stack-Quelle, Umgebung, Container-IDs und API-Konfiguration vorher geschützt
sichern. Für die Stack-Änderung die aktuelle produktive Quelle verwenden und
nur den alten API-Dienst sowie dessen Volume-Deklaration entfernen. Ausschließlich
seine nicht mehr referenzierten Stack-Variablen löschen. Kein allgemeines
Container- oder Volume-Pruning ausführen. Den verwaisten API-Container gezielt
stoppen und ohne zugehörige Volumes löschen.

Die Weiterleitung `api.guben.de` zeigt ausschließlich auf `guben-api-prod:5000`.
Sie wird über die normale Disable-Funktion des Proxy Managers deaktiviert und
für einen Rollback erhalten. Andere Proxy-Hosts bleiben unverändert.

Nachher prüfen: alte API nicht mehr vorhanden, vier aktive Container unverändert,
alle bisherigen Volumes vorhanden. Öffentliche Startseite, Projekte, Karte,
Veranstaltungsliste/-detail, Buchungs-API und die bereits korrigierten alten
Projektlinks müssen weiterhin funktionieren. Event-404 bleibt erhalten.

Bei Problemen den privat gesicherten Stack einschließlich Umgebung wiederherstellen.
Das bisherige API-Image und sein Data-Protection-Volume bleiben dafür verfügbar.
