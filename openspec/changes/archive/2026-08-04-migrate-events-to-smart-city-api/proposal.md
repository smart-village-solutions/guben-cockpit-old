## Why

Die bestehende Event-Integration im `frontend/` lädt HTML ueber `VITE_BOOKING_URL/html/:tenant/events` und extrahiert Event-, Detail- und Ticketdaten per `DOMParser`. Dieser Pfad ist fragil, schwer testbar und an die Markup-Struktur des Legacy-Booking-Frontends gekoppelt.

Der vorherige Booking-Migrationschange war unnoetig blockiert, weil Event-Endpunkte in der neuen Smart-City-Booking-API noch nicht ausreichend live verifiziert waren. Event-Migration bekommt deshalb einen eigenen Change mit eigener Verifikations- und Rollout-Logik.

## What Changes

- Das Frontend verifiziert die benoetigten Smart-City-Booking-JSON-Endpunkte fuer Event-Liste, Event-Detail und zugehoerige Ticketinformationen gegen die Live-Instanz.
- Event-Daten werden erst nach erfolgreicher Verifikation auf einen dedizierten Frontend-API-Client und JSON-basierte Mappings umgestellt.
- Die bestehende HTML-Scraping-Logik in `frontend/src/components/events/*` wird nach erfolgreicher Migration entfernt.
- Event-spezifische UI-Flows erhalten deterministische Fehlerzustaende fuer Konfigurations-, Transport-, HTTP- und Payloadfehler.
- Nach abgeschlossener Event-Migration werden die verbliebenen Legacy-Runtime-Pfade wie `VITE_BOOKING_URL` und `/api/booking` entfernt oder auf nicht mehr benoetigte Teile reduziert.

## Capabilities

### New Capabilities
- `smart-city-event-api-integration`: Das Frontend konsumiert Event-Daten ausschliesslich ueber verifizierte Smart-City-Booking-JSON-Endpunkte.
- `event-api-error-surface`: Das Frontend stellt Event-API-Ausfaelle, Fehlkonfigurationen und ungueltige Event-Payloads als explizite Fehlerzustaende dar.

### Modified Capabilities
- _Keine bestehenden Capabilities vorhanden._

## Impact

- Anpassungen in `frontend/src/components/events/*`, eventbezogenen Public-Content-Seiten, `frontend/src/stores/eventStore.ts` und zugehoerigen Tests.
- Neuer Frontend-Code fuer Event-API-Client, Schemas, Mapper und Fehlerobjekte, voraussichtlich unter `frontend/src/event-api/*`.
- Anpassung von Runtime- und Deployment-Konfiguration nach erfolgreicher Event-Migration, insbesondere Entfernung verbliebener Legacy-HTML-Pfade.
- Verifikation der benoetigten Live-Event-Endpunkte ist ein expliziter Blocker fuer Implementierung und Rollout.
