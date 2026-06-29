## 0. Rollout Gate

- [x] 0.1 Verifizieren, dass direkter Browserzugriff auf `VITE_BOOKING_API_URL` in lokaler Entwicklung funktioniert.
- [x] 0.2 Verifizieren, dass direkter Browserzugriff auf `VITE_BOOKING_API_URL` in mindestens einer deployten Zielumgebung funktioniert.
- [x] 0.3 Dokumentieren, ob `bookingUrl` fuer Bookables direkt aus der API kommt oder deterministisch konstruiert werden muss.

## 1. API Foundation

- [x] 1.1 Eine dedizierte Frontend-Konfiguration fuer `VITE_BOOKING_API_URL` einfuehren und in `frontend/.env.example` dokumentieren.
- [x] 1.2 Eine neue `frontend/src/booking-api/`-Struktur fuer Config, Client, Schemas, Mappers und Query-Helfer anlegen.
- [x] 1.3 Normalisierte Fehlerklassen fuer Transportfehler, HTTP-Fehler, ungueltige Payloads und Konfigurationsfehler implementieren.
- [x] 1.4 JSON-Fixtures aus der Live-Smart-City-Booking-API fuer mindestens `bookables/public` und `occupancy` ablegen.

## 2. Internal Model Contract

- [x] 2.1 Den Zielvertrag fuer `Booking`- und `Ticket`-Modelle gegen die aktuell benoetigten UI-Felder dokumentieren und in Mapper-Tests absichern.
- [x] 2.2 Schema-Validierung und Mapping fuer `GET /api/:tenant/bookables/public` gegen diesen internen Modellvertrag implementieren.
- [x] 2.3 Sichere Defaults fuer optionale Felder wie `flags`, `autoCommitNote`, `price`, `tickets` und `bookings` definieren und testen.

## 3. Bookables Migration

- [x] 3.1 Booking-State und Booking-Komponenten so refactoren, dass sie gemappte JSON-Modelle statt HTML-abgeleiteter Objekte konsumieren.
- [x] 3.2 Die aktuelle Booking-Overview in `bookingIntegration.tsx` und zugehoerigen Routen auf den neuen Booking-API-Client umstellen.
- [x] 3.3 `DOMParser`-Extraktion und Legacy-HTML-Selektoren aus dem Booking-Overview-Flow entfernen.

## 4. Availability and Error UX

- [x] 4.1 Schema-Validierung und Client-Support fuer `GET /api/:tenant/bookables/:id/occupancy` implementieren.
- [x] 4.2 Occupancy-Daten in die Booking-Views integrieren, die Verfuegbarkeit darstellen.
- [x] 4.3 Explizite UI-Zustaende fuer Konfigurationsfehler, unerreichbare API, HTTP-Fehler und ungueltige Payloads in Booking-Overview und Booking-Detailflaechen einfuehren.
- [x] 4.4 Partial-Failure-Verhalten absichern: fehlgeschlagene Occupancy- oder Detail-Requests duerfen valide Bookable-Listen nicht in leere Gesamtansichten verwandeln.
- [x] 4.5 Retry-Aktionen fuer erneut ausfuehrbare Booking-Requests bereitstellen.

## 5. Runtime Separation

- [x] 5.1 Alte Booking-HTML-Basis-URL-Nutzung aus Booking-Flows entfernen und Booking-Code ausschliesslich auf `VITE_BOOKING_API_URL` umstellen.
- [x] 5.2 Verbleibende Event-HTML-Pfade und eventbezogene Proxy-Nutzung unveraendert lassen und in der Doku als bewusst temporaer markieren.
- [x] 5.3 Deployment- und Runbook-Dokumentation so aktualisieren, dass neue Booking-API- und alte Event-HTML-Konfiguration getrennt beschrieben sind.

## 6. Verification

- [x] 6.1 Unit-Tests fuer Booking-API-Schemas, Mappers und Fehlernormalisierung hinzufuegen.
- [x] 6.2 Komponenten- oder Routentests fuer Success, valide leere Antwort, unerreichbare API, HTTP-Fehler, ungueltige Payload und fehlende Konfiguration abdecken.
- [x] 6.3 Nachweisen, dass keine Booking-Codepfade mehr `backend.booking.guben.de` oder `/api/booking/html/*` anfragen.
- [x] 6.4 Einen Smoke-Test gegen die echte Booking-API in einer deployten Umgebung dokumentieren.
