# Alte Projektlinks

Alte Projektseiten mit rein numerischer ID, etwa `/projects/237`,
`/projects/238` oder `/projects/553`, führen auf die Projektübersicht
`/projects`. Einige dieser alten IDs gehören inzwischen zu mehreren
veröffentlichten Datensätzen. Die Übersicht bietet die aktuellen Links an,
ohne einen dieser Datensätze willkürlich auszuwählen.

Direkte GET- und HEAD-Aufrufe erhalten HTTP 302 mit `Cache-Control: no-store`.
Bei Navigation innerhalb der App leitet der Router vor dem Laden der
Detailseite um. Das gilt für alle rein numerischen Projekt-IDs. Die aktuellen
IDs `featured:…` und `poi:…` sowie die festen Schul- und Marktplatzrouten
bleiben unverändert. Die JSON-API und die Daten im Mainserver werden nicht
verändert; mehrdeutige alte API-IDs werden weiterhin abgewiesen.

## Prüfung und Rollout

`npm run test:server --prefix frontend` prüft die tatsächlichen HTTP-Antworten,
auch bei alten vorgerenderten Projektseiten. Der Frontend-Test
`src/public-content/legacy-project-redirect.test.ts` prüft die App-Navigation.

Für den begrenzten Rollout ergänzt
`frontend/docker/Dockerfile.legacy-project-links` das bisherige produktive
Frontend um diese beiden Korrekturen. Der Startprozess baut die App mit den
aktualisierten Routen neu. In Portainer wird ausschließlich
`VERSION_FRONTEND=v0.8.49-legacy-project-links.1` gesetzt. Die bisherigen
Event-Statuskorrekturen bleiben enthalten. Andere Services und die
Stack-Konfiguration bleiben unverändert.

Vorher Stack-Quelle, Umgebung und Container-IDs geschützt sichern; nachher
Image, aktive Dateien, die drei alten Links, aktuelle Projekte und die
Event-Fehlerbehandlung prüfen. Ein Rollback stellt den gesicherten
Frontend-Versionswert wieder her.
