# Content Gateway API

Diese Referenz beschreibt die oeffentliche, ausschliesslich lesende Content-API
des Guben Cockpits. Sie ist fuer das Web-Frontend und fuer externe Anwendungen
gedacht, die dieselben veroeffentlichten Inhalte abrufen moechten.

Die API ist kein Schreib- oder Verwaltungszugang. Insbesondere sind die
PostgREST-, Smart-Village-GraphQL- und OAuth-Schnittstellen interne Upstreams
und duerfen nicht direkt verwendet werden.

## Basis und Zugriff

Produktive Basis-URL:

```
https://cockpit.guben.de
```

Alle Content-Endpunkte beginnen mit `/api/content`. Sie akzeptieren nur
`GET`; Browser duerfen `OPTIONS` fuer CORS-Preflights verwenden. Aktuell ist
keine Authentifizierung vorgesehen und der Gateway-CORS-Handler laesst
browserseitige Aufrufe von beliebigen Origins zu.

Die Schnittstelle liefert ausschliesslich veroeffentlichte oeffentliche
Inhalte. Sie ist nicht als Ersatz fuer eine Admin- oder Import-API geeignet.
Es gibt derzeit weder eine zugesicherte API-Version im URL-Pfad noch ein
Rate-Limit im Gateway. Anwendungen sollen deshalb nur dokumentierte Felder
auswerten, Timeouts setzen und bei Bedarf ihre Abrufe selbst drosseln.

Beispiel:

```bash
curl --fail --silent \
  'https://cockpit.guben.de/api/content/public?lang=de'
```

## Gemeinsame Regeln

### Sprache

Die sprachabhaengigen Endpunkte akzeptieren `lang` als zweistelligen
Sprachcode, zum Beispiel `de`, `en` oder `pl`. Fehlt der Parameter, verwendet
das Gateway zuerst die erste Sprache aus `Accept-Language`, anschliessend die
Server-Standardsprache (derzeit `de`). Ungueltige Sprachwerte fallen ebenfalls
auf diese Standardsprache zurueck.

### Paginierung

`pageNumber` und `pageSize` sind positive ganze Zahlen. Nicht angegebene Werte
werden pro Endpunkt vorbelegt. `pageSize` darf hoechstens `100` sein.

### Antworten und Vertraege

Erfolgreiche Antworten sind JSON. Die maschinenlesbare Referenz der
Response-Felder ist die gemeinsam von Frontend und Gateway verwendete
[Zod-Vertragsdatei](../shared/public-content/contracts.ts). Die dort
exportierten `*Schema`-Definitionen sind normativ; die folgende Tabelle ordnet
sie den Endpunkten zu.

| Methode und Pfad | Zweck | Antwortvertrag |
| --- | --- | --- |
| `GET /api/content/public` | Gebuendelter Einstieg fuer lokal strukturierte Start- und Mein-Guben-Inhalte; ohne Events und Booking | `publicContentBundleSchema` |
| `GET /api/content/home` | Startseite mit SEO, Hero und Dashboard-Vorschau | `homeContentSchema` |
| `GET /api/content/dashboard` | Vollstaendige Dashboard-Dropdowns und Tabs | `dashboardContentSchema` |
| `GET /api/content/projects` | Regulare Projektliste | `projectsContentSchema` |
| `GET /api/content/featured-projects` | Hervorgehobene Projekte | `featuredProjectsContentSchema` |
| `GET /api/content/featured-projects/:id` | Detail eines hervorgehobenen Projekts | `featuredProjectDetailContentSchema` |
| `GET /api/content/events` | Terminliste | `eventsContentSchema` |
| `GET /api/content/events/:id` | Termindetail | `eventDetailContentSchema` |
| `GET /api/content/pois` | Liste oeffentlicher Orte/POIs | `poisContentSchema` |
| `GET /api/content/pois/:id` | POI-Detail | `poiDetailContentSchema` |
| `GET /api/content/map` | Karteninhalt und Seitentexte | `mapContentSchema` |
| `GET /api/content/footer` | Footer-Inhalte | `footerContentSchema` |
| `GET /api/content/booking-tenants` | Oeffentliche Booking-Tenant-IDs | `bookingTenantsContentSchema` |
| `GET /api/content/booking/faqs` | Sprachabhaengige Booking-FAQs | `bookingFaqsContentSchema` |

`/api/content/public` ist die beste Wahl, wenn eine Anwendung nur die
gebuendelten lokalen Inhalte benoetigt. Die darin enthaltenen Dashboard-Karten
sind unter `home.cards` flach strukturiert. Fuer die vollstaendige Dropdown-
und Tab-Navigation sind `/home` und `/dashboard` zu verwenden.

## Content-Endpunkte

### Gebuendelte, Seiten- und Layout-Inhalte

| Endpoint | Query-Parameter | Hinweise |
| --- | --- | --- |
| `GET /api/content/public` | `lang` optional | Ein Request fuer das lokale Content-Bundle; keine Events oder Booking-Daten. |
| `GET /api/content/home` | `lang` optional | Startseiteninhalt einschliesslich SEO-Metadaten. |
| `GET /api/content/dashboard` | `lang` optional | Dropdowns, Tabs und Informationskarten. |
| `GET /api/content/map` | `lang` optional | Kartenbezogene Inhalte. |
| `GET /api/content/footer` | keine | Footer ist nicht sprachabhaengig. |
| `GET /api/content/booking-tenants` | keine | Liefert nur die fuer die Buchungsintegration benoetigten oeffentlichen Tenant-IDs. |
| `GET /api/content/booking/faqs` | `lang` optional | FAQ-Eintraege fuer die angeforderte Sprache. |

### Projekte

`GET /api/content/projects` akzeptiert:

| Parameter | Typ | Standard | Beschreibung |
| --- | --- | --- | --- |
| `lang` | Sprachcode | Sprachregel oben | Sprache der Inhalte. |
| `pageNumber` | positive Ganzzahl | `1` | Einsbasierte Seitennummer. |
| `pageSize` | positive Ganzzahl, max. `100` | `12` | Eintraege pro Seite. |

Beispiel:

```bash
curl --fail --silent \
  'https://cockpit.guben.de/api/content/projects?lang=de&pageNumber=1&pageSize=12'
```

Hervorgehobene Projekte sind eine separate, nicht paginierte Sammlung:

```text
GET /api/content/featured-projects?lang=de
GET /api/content/featured-projects/{id}?lang=de
```

`{id}` muss eine nicht leere ID sein. IDs aus der Listenantwort sollen
unveraendert und URL-kodiert in der Detail-URL eingesetzt werden.

### Termine

`GET /api/content/events` akzeptiert folgende Parameter:

| Parameter | Typ | Standard | Beschreibung |
| --- | --- | --- | --- |
| `lang` | Sprachcode | Sprachregel oben | Sprache der Inhalte. |
| `pageNumber` | positive Ganzzahl | `1` | Einsbasierte Seitennummer. |
| `pageSize` | positive Ganzzahl, max. `100` | `25` | Eintraege pro Seite. |
| `title` | String | — | Titel-Such- bzw. Filterwert. |
| `category` | String | — | Kategorie-Filterwert. |
| `startDate` | String | — | Startdatum-Filter; das Format wird an den Content-Upstream weitergegeben. |
| `endDate` | String | — | Enddatum-Filter; das Format wird an den Content-Upstream weitergegeben. |
| `sortBy` | String | — | Sortierfeld des Event-Upstreams. |
| `ordering` | String | — | Sortierrichtung des Event-Upstreams. |
| `distance` | Zahl | — | Distanz-Filterwert des Event-Upstreams. |

Beispiel:

```bash
curl --fail --silent \
  'https://cockpit.guben.de/api/content/events?lang=de&pageNumber=1&pageSize=25'
```

Ein Detail wird ueber die ID aus dem Listenresultat abgefragt:

```text
GET /api/content/events/{id}?lang=de
```

### Orte (POIs)

`GET /api/content/pois` akzeptiert ausschliesslich die folgenden Parameter;
unbekannte Parameter werden mit `400` abgewiesen.

| Parameter | Typ | Standard | Beschreibung |
| --- | --- | --- | --- |
| `lang` | Sprachcode | Sprachregel oben | Sprache der Inhalte. |
| `search` | String, max. 200 Zeichen | — | Freitextsuche. |
| `categoryIds` | String oder mehrfacher Parameter | leer | Kategorie-IDs, zum Beispiel `categoryIds=1,2` oder `categoryIds=1&categoryIds=2`. |
| `location` | String, max. 200 Zeichen | — | Ortsfilter. |
| `radius` | positive Zahl, max. `500` | — | Suchradius. |
| `sort` | `name` oder `updatedAt` | `name` | Sortierfeld. |
| `direction` | `asc` oder `desc` | `asc` | Sortierrichtung. |
| `pageNumber` | positive Ganzzahl | `1` | Einsbasierte Seitennummer. |
| `pageSize` | positive Ganzzahl, max. `100` | `12` | Eintraege pro Seite. |

Beispiel:

```bash
curl --fail --silent \
  'https://cockpit.guben.de/api/content/pois?lang=de&categoryIds=6186,6187&sort=updatedAt&direction=desc&pageNumber=1&pageSize=12'
```

Ein POI-Detail wird ueber die ID aus dem Listenresultat abgefragt:

```text
GET /api/content/pois/{id}?lang=de
```

## Fehlerantworten

Bei Validierungsfehlern, nicht gefundenem Inhalt und Upstream-Fehlern liefert
das Gateway einen JSON-Body nach `gatewayErrorSchema`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "...",
    "upstream": "gateway",
    "retryable": false,
    "requestId": "..."
  }
}
```

| HTTP-Status | Bedeutung |
| --- | --- |
| `200` | Erfolgreiche Anfrage. |
| `404` | Ein angefordertes Detail existiert nicht oder ist nicht oeffentlich. |
| `500` | Nicht erwarteter Gateway-Fehler; derzeit auch bei einer vom Gateway abgewiesenen Query-Validierung. |
| `502` | Ein Upstream lieferte eine fachlich oder technisch nicht verwertbare Antwort. |
| `503` | Ein erforderlicher Upstream ist nicht verfuegbar oder der Upstream-Request lief in ein Timeout. |

`code` ist einer von `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`,
`INVALID_UPSTREAM_PAYLOAD`, `NOT_FOUND` oder `INTERNAL_ERROR`. `upstream`
identifiziert `postgrest`, `smartvillage` oder `gateway`; `requestId` sollte
bei einer Betriebsanfrage immer mitgegeben werden.

## Betriebsendpunkte

Diese Endpunkte sind fuer Monitoring und Betrieb bestimmt, nicht fuer normale
Content-Integrationen:

| Endpoint | Antwort / Zweck |
| --- | --- |
| `GET /health` | Liveness und aktiver Content-Source-Modus. |
| `GET /health/live` | Reine Liveness-Pruefung. |
| `GET /health/ready` | Readiness des Gateways einschliesslich PostgREST und Smart Village; bei nicht bereitem Dienst `503`. |
| `GET /metrics` | Prometheus-Textformat mit Request-Latenzen und Upstream-Fehlerzaehlern. |

## Kompatibilitaet und Cache

Die Response-Vertraege werden im Repository durch gemeinsame Laufzeit-Schemas
validiert. Aenderungen an `shared/public-content/contracts.ts` und dieser
Referenz sollen gemeinsam reviewed werden.

Smart-Village-Content wird pro Gateway-Prozess zwischengespeichert: erfolgreiche
Antworten sind vier Minuten frisch; die zusaetzlichen Event- und POI-Caches
koennen Aenderungen normalerweise nach etwa fuenf Minuten sichtbar machen. Bei
einem fehlgeschlagenen Refresh kann die letzte fachlich gueltige Antwort bis zu
24 Stunden ab ihrer letzten Validierung weiter ausgeliefert werden. Clients
sollten Inhalte daher nicht als Echtzeitdaten behandeln.
