## 0. Contract Verification

- [ ] 0.1 Die benoetigten Live-Endpunkte fuer Event-Liste identifizieren und ihre Antwortstruktur dokumentieren.
- [ ] 0.2 Die benoetigten Live-Endpunkte fuer Event-Detail und zugehoerige Tickets identifizieren und ihre Antwortstruktur dokumentieren.
- [ ] 0.3 Festhalten, welche bisher im UI benoetigten Felder im Live-Vertrag fehlen, unsicher sind oder transformiert werden muessen.

## 1. API Foundation

- [ ] 1.1 Eine dedizierte Frontend-Konfiguration fuer die Event-API-Nutzung definieren und dokumentieren.
- [ ] 1.2 Eine neue `frontend/src/event-api/`-Struktur fuer Config, Client, Schemas, Mappers und Query-Helfer anlegen.
- [ ] 1.3 Normalisierte Fehlerklassen fuer Transportfehler, HTTP-Fehler, ungueltige Payloads und Konfigurationsfehler implementieren.
- [ ] 1.4 JSON-Fixtures aus den verifizierten Live-Event-Endpunkten ablegen.

## 2. Internal Model Contract

- [ ] 2.1 Den Zielvertrag fuer `BookingEvent`, `EventDetails` und Event-Tickets gegen die aktuell benoetigten UI-Felder dokumentieren und in Mapper-Tests absichern.
- [ ] 2.2 Sichere Defaults fuer optionale Felder wie `flags`, `details`, `coordinates`, `agenda` und `tickets` definieren und testen.

## 3. Event Migration

- [ ] 3.1 Schema-Validierung und Mapping fuer die verifizierten Event-Listenendpunkte implementieren.
- [ ] 3.2 Schema-Validierung und Mapping fuer die verifizierten Event-Detail- und Ticketendpunkte implementieren.
- [ ] 3.3 `eventIntegration.tsx` und eventbezogene UI-Komponenten auf die neue Event-API-Schicht umstellen.
- [ ] 3.4 `DOMParser`-Extraktion und Legacy-HTML-Selektoren aus den Event-Flows entfernen.

## 4. Error UX and Verification

- [ ] 4.1 Explizite UI-Zustaende fuer valide leere Liste, Konfigurationsfehler, unerreichbare API, HTTP-Fehler und ungueltige Payloads einfuehren.
- [ ] 4.2 Partial-Failure-Verhalten absichern: Listen-Teaser sichtbar halten, wenn nur Event-Detail- oder Ticket-Requests fehlschlagen.
- [ ] 4.3 Retry-Aktionen fuer erneut ausfuehrbare Event-Requests bereitstellen.
- [ ] 4.4 Unit-Tests fuer Schemas, Mappers und Fehlernormalisierung hinzufuegen.
- [ ] 4.5 Komponenten- oder Routentests fuer Success-, Empty-, Error- und Partial-Failure-Pfade hinzufuegen.

## 5. Runtime Cleanup

- [ ] 5.1 Verbleibende eventbezogene Nutzung von `VITE_BOOKING_URL` entfernen.
- [ ] 5.2 Den Legacy-Proxy `/api/booking` entfernen oder auf nicht mehr benoetigte Reste reduzieren.
- [ ] 5.3 Deployment- und Runbook-Dokumentation auf die vollstaendige Entfernung der Legacy-Event-HTML-Pfade aktualisieren.
