## Why

Die bestehende Booking-Integration im `frontend/` lädt HTML von `backend.booking.guben.de` beziehungsweise `/api/booking/html/*` und extrahiert daraus Daten per `DOMParser`. Dieser Pfad ist fragil, schwer testbar und passt nicht mehr zur neuen Smart-City-Booking-Plattform mit eigener JSON-API unter `guben-api.smart-city-booking.de`.

Der bisherige Change war zu breit geschnitten, weil er Booking- und Event-Migration gekoppelt hat, obwohl fuer Events noch kein ausreichend verifizierter Live-Vertrag vorliegt. Dadurch wurde der gesamte Umbau von einer unklaren API-Teilmenge blockiert. Dieser Change fokussiert deshalb ausschliesslich die Booking-Flows fuer `bookables/public` und `occupancy`.

## What Changes

- Das Frontend bezieht Booking-Daten fuer Buchungsuebersicht, Detailkontext und Verfuegbarkeiten ausschliesslich ueber die Smart-City-Booking-JSON-API.
- Ein neuer, typisierter Frontend-API-Client kapselt URL-Aufbau, Response-Validierung, Fehlernormalisierung und Mapping in explizite interne Booking-View-Modelle.
- Die HTML-Scraping-Logik in `frontend/src/components/booking/*` wird entfernt.
- Booking-spezifische UI-Flows erhalten deterministische Fehlerzustaende fuer Konfigurationsfehler, Transportfehler, HTTP-Fehler und ungueltige Payloads.
- Der Change fuehrt eine dedizierte Runtime-Konfiguration fuer die Booking-API-Basis-URL ein und trennt sie sauber von verbliebenen Legacy-Event-Pfaden.
- Die Entfernung der Event-HTML-Integration und der letzten Legacy-Proxy-Pfade erfolgt in einem separaten Folge-Change.
- **BREAKING**: Booking-Flows greifen nicht mehr auf `backend.booking.guben.de` oder `/api/booking/html/*` zurueck; fuer Booking gibt es keinen Fallback auf die alte HTML-Datenquelle.

## Capabilities

### New Capabilities
- `smart-city-booking-api-integration`: Das Frontend konsumiert Booking-Daten fuer Bookables und Verfuegbarkeiten ausschliesslich ueber die Smart-City-Booking-JSON-API.
- `booking-api-error-surface`: Das Frontend stellt Booking-API-Ausfaelle, Fehlkonfigurationen und ungueltige Booking-Payloads als explizite Fehlerzustaende dar.

### Modified Capabilities
- _Keine bestehenden Capabilities vorhanden._

## Impact

- Anpassungen in `frontend/src/components/booking/*`, `frontend/src/routes/booking/*`, `frontend/src/stores/bookingStore.ts` und zugehoerigen Tests.
- Neuer Frontend-Code fuer API-Client, Schemas, Mapper und Fehlerobjekte, voraussichtlich unter `frontend/src/booking-api/*`.
- Neue Runtime-Konfiguration fuer die Booking-API-Basis-URL in `frontend/.env.example`, Deployment-Env und Dokumentation.
- Vor Rollout ist eine verbindliche Verifikation von CORS- und Erreichbarkeitsannahmen fuer die neue API in den Zielumgebungen erforderlich.
- Die bestehende Event-Integration unter `frontend/src/components/events/*` und eventbezogene Legacy-Runtime-Pfade bleiben bis zum separaten Event-Change unangetastet.
