## Context

Die aktuelle Event-Integration in `frontend/src/components/events/eventIntegration.tsx` laedt HTML unter `VITE_BOOKING_URL/html/:tenant/events` und parst daraus Event-Listen, Detailansichten, Tickets und Standortinformationen. Danach werden zusaetzlich Geokoordinaten ueber Photon aufgeloest. Diese Logik ist an CSS-Klassen, DOM-Struktur und Link-Parameter der Legacy-Seiten gekoppelt.

Fuer die neue Smart-City-Booking-Plattform existieren Hinweise auf Event-Endpunkte, aber der Live-Vertrag fuer die benoetigten Listen-, Detail- und Ticketdaten ist bisher nicht ausreichend nachgewiesen. Deshalb wird Event-Migration bewusst als eigener Change mit vorangestellter Vertragsverifikation gefuehrt.

## Goals / Non-Goals

**Goals:**
- Die fuer die bestehende Event-UI benoetigten Live-JSON-Endpunkte verifizieren und ihren unterstuetzten Datenvertrag festhalten.
- Event-Daten nach erfolgreicher Verifikation ueber eine dedizierte Frontend-API-Schicht laden.
- Ein stabiles internes Event-Modell fuer `BookingEvent`, `EventDetails` und Event-Tickets definieren.
- Fehlerzustand, Retry-Verhalten und leere Ergebnisse fuer Event-Flows explizit definieren.
- Nach erfolgreicher Migration die verbliebenen Legacy-HTML-Runtime-Pfade entfernen.

**Non-Goals:**
- Booking-Overview-, Booking-Detail- oder Occupancy-Flows erneut anfassen.
- Event-Daten ohne verifizierten Live-Vertrag heuristisch aus HTML oder Browser-Scraping rekonstruieren.
- Geocoding ueber Photon funktional neu gestalten, sofern keine API-Aenderung dafuer noetig ist.

## Decisions

### 1. Verify the live event contract before implementation

Bevor Event-Mapping oder UI-Umbau beginnt, werden die benoetigten Live-Endpunkte fuer Event-Liste, Event-Detail und Event-Tickets verifiziert und ihre tatsaechlich nutzbaren Felder dokumentiert.

Rationale:
- Verhindert, dass auf Basis veralteter oder unvollstaendiger Dokumentation implementiert wird.
- Macht Blocker frueh sichtbar.

Alternatives considered:
- Event-Migration direkt implementieren und spaeter anpassen: verworfen, weil die aktuelle Unsicherheit den Change sonst wieder unabschliessbar macht.

### 2. Freeze an explicit internal event model contract

Die JSON-Antworten werden in ein stabiles internes Modell gemappt, das sich an den heute im Event-Store verwendeten Feldern orientiert.

Event core fields:
- required: `title`, `date`, `organizer`, `contactName`, `contactPhone`, `contactEmail`, `teaser`, `bkid`, `imgUrl`
- optional: `flags`, `details`, `coordinates`

Event detail core fields:
- optional but normalized when available: `longDescription`, `eventLocation`, `eventLocationEmail`, `eventOrganizer`, `agenda`, `teaserImage`, `street`, `houseNumber`, `zip`, `city`, `tickets`

Event ticket core fields:
- required: `title`, `prices`, `bookingUrl`, `bkid`, `imgUrl`
- optional: `description`, `location`, `type`, `flags`, `autoCommitNote`

Rationale:
- Haelt API- und UI-Vertrag auseinander.
- Macht die Migration testbar und reviewbar.

### 3. Keep legacy event paths until verified JSON replacement exists

Die bestehende HTML-Integration bleibt aktiv, bis die verifizierten JSON-Endpunkte implementiert und abgenommen sind. Erst danach werden `VITE_BOOKING_URL`, `/api/booking` und eventbezogene HTML-Scraping-Pfade entfernt.

Rationale:
- Verhindert einen unfertigen harten Cut ohne belegte Ersatzquelle.

### 4. Specify event UX for empty, error, and partial-detail states

Event-Fehler werden mit klarer UI-Semantik behandelt:
- Ein Fehler im Event-Listenload blockiert die Event-Liste.
- Ein Fehler im Event-Detailload bleibt auf das betroffene Event begrenzt, sofern Listen- oder Teaserdaten bereits vorhanden sind.
- Retry wird fuer transient fehlgeschlagene Requests angeboten.
- Leere Listen und Fehler werden sichtbar voneinander unterschieden.

Rationale:
- Event-Teaser, Detailansichten und Tickets haben unterschiedliche Fehlerschnitte.

## Risks / Trade-offs

- [Live-Endpunkte liefern nicht alle bisher im HTML verfuegbaren Felder] -> Mitigation: Vertragsluecken explizit dokumentieren und UI-Anforderungen priorisieren.
- [Event-Detaildaten und Ticketdaten koennen unterschiedlich verifiziert sein] -> Mitigation: Listen- und Detailvertrag getrennt pruefen und Partial Failure explizit behandeln.
- [Photon-Geocoding bleibt externer Laufzeitfaktor] -> Mitigation: Bestehendes Verhalten beibehalten und Geocoding-Fehler von Event-API-Fehlern trennen.

## Migration Plan

1. Live-Event-Endpunkte fuer Liste, Detail und Tickets verifizieren und den nachgewiesenen JSON-Vertrag dokumentieren.
2. Event-API-Konfiguration, Client, Schemas und Mappers anlegen.
3. Internen Event-Modellvertrag in Mappers und Tests festschreiben.
4. Event-Listenflow auf verifizierte JSON-Endpunkte umstellen.
5. Event-Detail- und Ticket-Flow auf verifizierte JSON-Endpunkte umstellen.
6. Explizite Event-Fehler- und Empty-State-UX einfuehren.
7. Legacy-HTML-Integration, `DOMParser`-Code und verbleibende Runtime-Pfade entfernen.

Rollback strategy:
- Vor erfolgreicher Migration bleibt die Legacy-Event-Integration aktiv.
- Nach Rollout erfolgt Rollback ueber Release-Ruecknahme, nicht ueber einen parallelen Dauer-Fallback.

## Open Questions

- Welche Live-Endpunkte liefern den fuer `details.tickets` benoetigten Datenumfang tatsaechlich?
- Koennen Event-spezifische Ziel-Links direkt aus der API uebernommen werden, oder muessen sie aus Vertragsfeldern rekonstruiert werden?
