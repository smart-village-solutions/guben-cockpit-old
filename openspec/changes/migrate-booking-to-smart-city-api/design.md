## Context

Das aktuelle `frontend/` integriert Buchungsdaten ueber HTML-Endpunkte unter `VITE_BOOKING_URL/html/:tenant/...`. Die Implementierung in `bookingIntegration.tsx` parst fremdes HTML, leitet daraus fachliche Felder ab und speichert die Ergebnisse in `bookingStore`. Dieses Verhalten ist eng an CSS-Klassen und Linkstrukturen des Legacy-Booking-Frontends gekoppelt.

Parallel dazu existiert mit `https://guben-api.smart-city-booking.de` eine neue API-Domain der Smart-City-Booking-Plattform. Live verifiziert sind oeffentliche JSON-Antworten fuer `GET /api/:tenant/bookables/public` sowie Verfuegbarkeiten ueber `GET /api/:tenant/bookables/:id/occupancy`.

Die aktuelle Event-Integration verwendet weiterhin HTML-Scraping unter `VITE_BOOKING_URL/html/:tenant/events`. Weil die Event-Vertraege noch nicht belastbar verifiziert sind, wird dieser Teil bewusst aus dem Booking-Change herausgeloest. Der Booking-Umbau darf nicht mehr von offenen Event-Fragen abhaengen.

## Goals / Non-Goals

**Goals:**
- Booking-Daten fuer Overview-, Detail- und Availability-Flows ausschliesslich ueber die Smart-City-Booking-JSON-API laden.
- HTML-Scraping und `DOMParser`-basierte Extraktion aus den Booking-Flows vollstaendig entfernen.
- Alle Booking-Antworten im Frontend validieren und in ein explizites internes Booking-Modell mappen.
- Netzwerkfehler, HTTP-Fehler, Payloadfehler und Konfigurationsfehler sauber unterscheiden und im UI explizit darstellen.
- Vor dem Rollout die CORS- und Connectivity-Annahmen fuer direkten Frontend-Zugriff auf die neue API in Zielumgebungen verifizieren.
- Runtime und Deployment so schneiden, dass neue Booking-API-Pfade und verbliebene Legacy-Event-Pfade getrennt konfiguriert werden koennen.

**Non-Goals:**
- Event-Datenfluesse auf die Smart-City-Booking-API umstellen.
- Die bestehende Event-HTML-Integration oder eventbezogene Proxy-Pfade in diesem Change entfernen.
- Einen Fallback auf `backend.booking.guben.de` oder `/api/booking/html/*` fuer Booking bereitstellen.
- Die neue Booking-API serverseitig ueber das bestehende `content-gateway/` zu spiegeln.
- Die allgemeine Public-Content-Architektur oder PostgREST-Logik dieses Repos zu aendern.

## Decisions

### 1. Introduce a dedicated frontend booking API layer

Das Frontend bekommt eine eigene API-Schicht unter `frontend/src/booking-api/` mit getrennten Modulen fuer Konfiguration, HTTP-Client, Schemas, Mapper und Query-Helfer.

Rationale:
- Trennt Roh-API, Fehlernormalisierung und UI-Modelle sauber.
- Erleichtert Tests mit JSON-Fixtures.
- Verhindert, dass Komponenten direkt URL- oder Response-Details kennen.

Alternatives considered:
- Logik direkt in `bookingIntegration.tsx` belassen: verworfen, weil dieselbe Unordnung wie beim HTML-Scraping entstuende.
- Neue API ueber `content-gateway/` proxien: fuer diesen Change verworfen, weil der Nutzer explizit den Frontend-Umbau angefragt hat und kein serverseitiger Zwischenschritt benoetigt ist.

### 2. Freeze an explicit internal booking model contract

Die JSON-Antworten werden in ein stabiles internes Modell gemappt, das sich an den heute im Booking-Store und in den Booking-Komponenten verwendeten Feldern orientiert.

Bookable core fields:
- required: `title`, `description`, `location`, `type`, `imgUrl`, `bookingUrl`, `prices`, `category`
- optional: `price`, `flags`, `bkid`, `autoCommitNote`, `tickets`, `bookings`

Ticket core fields:
- required: `title`, `description`, `location`, `type`, `prices`, `bookingUrl`, `bkid`, `imgUrl`
- optional: `flags`, `autoCommitNote`

Rationale:
- Macht die Migration reviewbar, weil klar ist, welche UI-Felder verbindlich weiter bedient werden.
- Reduziert Diskussionen ueber Mapping-Details waehrend der Implementierung.
- Erlaubt es, den API-Vertrag von der UI bewusst zu entkoppeln.

Alternatives considered:
- Roh-API-Objekte direkt in den Store legen: verworfen, weil dann jede UI-Aenderung an API-Feldnamen gekoppelt waere.
- Altes HTML-Modell heuristisch nachbilden: verworfen, weil das die neue API nicht als saubere Quelle ernst nimmt.

### 3. Treat the Smart-City-Booking API as the only source of truth for booking flows

Alle Booking-Flows verwenden nur noch `VITE_BOOKING_API_URL` und die JSON-Endpunkte. Die Legacy-HTML-Routen bleiben ausschliesslich fuer noch nicht migrierte Event-Flows bestehen.

Rationale:
- Erzwingt einen klaren Architekturwechsel fuer Booking statt einer hybriden Zwischenloesung.
- Erlaubt gleichzeitig einen sauberen Split zwischen Booking- und Event-Migration.

Alternatives considered:
- Feature-Flag oder Fallback auf alte HTML-Routen fuer Booking: explizit verworfen, weil der Nutzer einen harten Cut verlangt hat.
- Booking- und Event-Migration in einem Change belassen: verworfen, weil unklare Event-Endpunkte den Booking-Umbau blockieren.

### 4. Make frontend connectivity a rollout gate, not an open question

Direkter Browserzugriff auf `guben-api.smart-city-booking.de` wird vor dem Rollout in lokaler Entwicklung und mindestens einer deployten Zielumgebung verifiziert. Solange diese Verifikation nicht vorliegt, bleibt der Rollout blockiert.

Rationale:
- CORS- oder Netzwerkprobleme duerfen nicht erst nach Umbau im Produkt sichtbar werden.
- Der Architekturentscheid fuer direkten Frontend-Zugriff wird dadurch belastbar.

Alternatives considered:
- CORS/Connectivity als spaetere Betriebsfrage behandeln: verworfen, weil dies die zentrale Laufzeitannahme des Changes ist.
- Sofort einen neuen Proxy fuer die JSON-API einplanen: verworfen, solange kein nachgewiesenes Laufzeitproblem vorliegt.

### 5. Specify user-visible error behavior, not only error categories

Booking-Fehler werden nicht nur technisch klassifiziert, sondern mit klarer UI-Semantik definiert:
- Overview-Fehler und Konfigurationsfehler blockieren die gesamte Booking-Seite fuer den betroffenen Load.
- Occupancy- oder Detailfehler bleiben auf den betroffenen Teilbereich begrenzt, sofern der Rest der Booking-Daten valide ist.
- Fehlerzustaende bieten eine explizite Retry-Aktion fuer erneut ausfuehrbare Requests.
- Leere Ergebnisse duerfen nur dann als leer angezeigt werden, wenn die API-Antwort valide leer ist.

Rationale:
- Der harte Cut ohne Fallback braucht ein bewusstes UX-Verhalten.
- Partial Failure muss fuer Nutzer nachvollziehbar bleiben.

Alternatives considered:
- Fehler nur loggen und ansonsten leere oder teilweise kaputte Ansichten rendern: verworfen, weil das fachlich und betrieblich intransparent ist.

### 6. Preserve legacy event runtime paths until the event change lands

Der bestehende `/api/booking`-Proxy und `VITE_BOOKING_URL` duerfen in diesem Change nur insoweit reduziert werden, dass Booking-Flows sie nicht mehr verwenden. Vollstaendige Entfernung erfolgt erst zusammen mit der Event-Migration.

Rationale:
- Verhindert, dass der Booking-Change bestehende Event-Flows unbeabsichtigt bricht.
- Spiegelt den neuen Change-Schnitt korrekt in Runtime und Deployment wider.

Alternatives considered:
- Legacy-Proxy in diesem Change vollstaendig entfernen: verworfen, weil Events aktuell noch davon abhaengen.

## Risks / Trade-offs

- [API-Felder passen nicht 1:1 auf das bestehende Booking-Modell] -> Mitigation: Mapping bewusst gegen den eingefrorenen internen Modellvertrag bauen und UI-Abweichungen explizit adressieren.
- [Harter Cut erzeugt sichtbare Fehler statt stiller Degeneration] -> Mitigation: klare Fehlerkomponenten, Retry-Aktionen und Tests fuer valide leere Antworten versus Fehlerantworten.
- [Direkter Browserzugriff auf die neue API funktioniert in manchen Umgebungen nicht] -> Mitigation: Rollout-Gate fuer lokale und deployte Connectivity-Verifikation.
- [Legacy- und neue Runtime-Konfiguration laufen eine Zeit lang parallel] -> Mitigation: klare Trennung zwischen `VITE_BOOKING_API_URL` fuer Booking und verbleibenden Event-HTML-Pfaden.
- [Tests verlieren mit Entfernen der alten Logik viel bisherigen Fixture-Kontext] -> Mitigation: frueh JSON-Fixtures mit echten API-Beispielen anlegen und Mapper-Tests zuerst bauen.

## Migration Plan

1. Direkten Frontend-Zugriff auf die neue Booking-API in lokaler und deployter Zielumgebung verifizieren und das Ergebnis dokumentieren.
2. Neue Booking-API-Konfiguration, Client-, Schema- und Mapper-Schicht im Frontend anlegen.
3. Den internen Booking-Modellvertrag in Schemas, Mappers und Tests festschreiben.
4. Bookables-Read-Pfad in der Buchungsuebersicht auf `bookables/public` umstellen und Store-/UI-Modelle anpassen.
5. Occupancy-Verfuegbarkeiten dort anbinden, wo die UI sie benoetigt.
6. Fehlerkomponenten und Fehlerklassifikation fuer Overview-, Detail- und Availability-Flows einfuehren.
7. Legacy-HTML-Integration und `DOMParser`-Code aus den Booking-Flows entfernen.
8. Runtime, Deployment-Doku und Tests auf die neue Booking-API-Basis-URL anpassen, ohne die Legacy-Event-Pfade vorzeitig zu entfernen.

Rollback strategy:
- Es gibt keinen fachlichen Fallback auf die alte HTML-Logik fuer Booking.
- Bei Regressionen besteht Rollback darin, den gesamten Change nicht auszurollen oder auf einen frueheren Release-Stand zurueckzugehen.

## Open Questions

- Liefert die API fuer jedes Bookable einen stabilen Ziel-Link direkt mit, oder muss `bookingUrl` fuer einzelne Ressourcen aus API-Daten konstruiert werden?
