# Deploy-Runbook (Produktion)

Stand: 12. November 2026; abgeglichen mit `stack.prod.yml`, den Frontend-Startskripten und dem Release-Workflow. Dieses Runbook beschreibt den Rollout ueber Portainer. Laufende Versionen und private Betriebswerte sind vor jedem Rollout aktuell zu ermitteln.

## Stack und Versionsauswahl

Der Stack `cockpit` besteht aus vier Services:

| Service | Image / Version |
| --- | --- |
| `guben-web-prod` | `${CONTAINER_REGISTRY}guben-cockpit-web:${VERSION_FRONTEND:-${VERSION_WEB}}` |
| `guben-content-gateway-prod` | `${CONTAINER_REGISTRY}guben-cockpit-content-gateway:${VERSION_WEB}` |
| `guben-postgrest-prod` | `postgrest/postgrest:v12.2.8` |
| `guben-db-prod` | `postgres:17` |

`CONTAINER_REGISTRY` ist normalerweise `ghcr.io/smart-village-solutions/`. Bei einem normalen Release waehlt `VERSION_WEB` beide Cockpit-Images. Ist `VERSION_FRONTEND` gesetzt, bleibt das Frontend auf dieser separaten Version. Den Override deshalb bewusst entfernen oder auf die Zielversion setzen. Spezialimages fuer Event-Status und Projektlinks sind in den jeweiligen Aenderungsdokumenten beschrieben.

Der Tag-Workflow publiziert Images, erstellt aber keinen GitHub Release und deployt nicht. Siehe [Release-Verfahren](releases.md).

## Vor dem Rollout

1. Ziel-Commit, Release-Tag und erfolgreichen Image-Workflow pruefen. Beide Image-Manifeste und Digests festhalten. Die Zielversion nicht aus alten Env-Beispielen uebernehmen.
2. Aktuelle Portainer-Stackquelle, Umgebung und laufende Container-IDs/Image-Digests geschuetzt ausserhalb von Git sichern. Beide Versionswerte fuer den Rollback notieren. Sicherstellen, dass ein aktuelles Datenbank-Backup vorhanden und dessen Wiederherstellung geklaert ist.
3. Die aktuelle Stackquelle mit `stack.prod.yml` vergleichen; produktive Abweichungen gezielt bewerten. Ein regulaeres Release fuehrt keine Datenbankmigration und keinen SQL-Bootstrap aus.
4. Hostvoraussetzungen pruefen: externes Netzwerk `websites`, Volume `cockpit_guben-data-prod`, eingerichteter Journal-Namespace `guben-cockpit` und passende GHCR-Zugriffsrechte.
5. Gateway-Umgebung pruefen: `SV_GRAPHQL_URL`, `SV_OAUTH_TOKEN_URL`, `SV_CLIENT_ID`, `SV_CLIENT_SECRET` sind im Modus `postgrest` gemeinsam erforderlich. `PGRST_DB_URI` verbindet PostgREST mit der bestehenden DB. `FRONTEND_BASEURI` ist die oeffentliche Basis-URL.
6. Uebersetzungen bei Bedarf ueber `TRANSLATE_URL`, `TRANSLATE_API_KEY` und `TRANSLATE_TIMEOUT_MS` konfigurieren. Das Volume `translation-cache` speichert Ergebnisse; leere `TRANSLATE_URL` deaktiviert die automatische Ergaenzung.

Private Betriebswerte nur aus geschuetzter lokaler Konfiguration oder Portainer verwenden. Stack-/Env-Sicherungen koennen Zugangsdaten enthalten und gehoeren nicht in Git, Reports oder Konsolenausgaben. Die TLS-Beispiele setzen vertrauenswuerdige Zertifikate voraus; interne CAs gezielt mit `--cacert` verwenden.

Lesende Image-Pruefung nach Setzen von `TARGET_WEB_VERSION` auf den freigegebenen Tag:

```bash
gh run list --workflow release-prod.yml --limit 10
docker manifest inspect "ghcr.io/smart-village-solutions/guben-cockpit-web:$TARGET_WEB_VERSION" >/dev/null
docker manifest inspect "ghcr.io/smart-village-solutions/guben-cockpit-content-gateway:$TARGET_WEB_VERSION" >/dev/null
```

## Rollout in Portainer

1. `Stacks` -> `cockpit` -> `Editor` oeffnen und gesicherte aktuelle Konfiguration mit der vorgesehenen Aenderung abgleichen.
2. `VERSION_WEB` auf den freigegebenen Tag setzen; `VERSION_FRONTEND` wie oben beschrieben abgleichen. Vorhandene Zugangsdaten erhalten.
3. Web-Umgebung gemaess `stack.prod.yml` erhalten:
   - `PRERENDER_CONTENT_GATEWAY_URL=http://content-gateway:5100`
   - `INTERNAL_CONTENT_GATEWAY_URL=http://content-gateway:5100`
   - `VITE_CONTENT_GATEWAY_URL=${FRONTEND_BASEURI}`
   - `INTERNAL_BOOKING_URL` als Upstream fuer den vorhandenen `/api/booking`-Proxy
   - `VITE_BOOKING_URL=/api/booking` fuer die vorhandene Event-Booking-Integration
4. Stack aktualisieren und benoetigte Images ziehen. Bei `denied` Registry-Zugriff pro Image pruefen und gezielt vorpullen; danach bei Bedarf ohne erneutes Pullen aktualisieren.
5. Den Frontend-Start bis zum Ende von Build und Prerender verfolgen. `start-frontend.sh` wartet auf Gateway-`/health`; dies ersetzt keine Readiness-Pruefung beider Upstreams.
6. Container, Digests und Smoke-Tests pruefen.

Die oeffentliche Bookables-API ist eine eigene Integration ueber `VITE_BOOKING_API_URL`, konfiguriert beim Vite-Build, etwa in `frontend/.env`. Diese Variable wird im aktuellen Produktions-Compose nicht gesetzt. Den verwendeten Frontend-Build daher gesondert pruefen; eine beliebige Portainer-Laufzeitvariable wird nicht automatisch vom Stack an den Webdienst weitergereicht.

## Optionales Update ueber die Portainer-API

Die Werte `PORTAINER_URL`, `PORTAINER_TOKEN`, `PORTAINER_STACK_ID`, `PORTAINER_ENDPOINT_ID` und `TARGET_WEB_VERSION` muessen zuvor geschuetzt geladen sein. Das Beispiel erhaelt alle bestehenden Env-Eintraege, gleicht einen vorhandenen Frontend-Override auf die Zielversion ab und speichert sensible Antworten nur in einem privaten temporaeren Verzeichnis. Es setzt voraus, dass der Stackvergleich abgeschlossen und `stack.prod.yml` die freigegebene Zielquelle ist.

```bash
umask 077
deploy_dir=$(mktemp -d "${TMPDIR:-/tmp}/guben-deploy.XXXXXX")
export TARGET_WEB_VERSION
curl -fsS -H "X-API-Key: $PORTAINER_TOKEN" \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID" \
  > "$deploy_dir/stack-before.json"

jq '
  def upsert($name; $value):
    if any(.[]; .name == $name) then
      map(if .name == $name then .value = $value else . end)
    else . + [{name: $name, value: $value}] end;
  .Env | upsert("VERSION_WEB"; env.TARGET_WEB_VERSION)
  | if any(.[]; .name == "VERSION_FRONTEND") then
      upsert("VERSION_FRONTEND"; env.TARGET_WEB_VERSION)
    else . end
' "$deploy_dir/stack-before.json" > "$deploy_dir/env.json"

jq -n --rawfile content stack.prod.yml --slurpfile env "$deploy_dir/env.json" \
  '{stackFileContent:$content, env:$env[0], prune:false, pullImage:true}' \
  > "$deploy_dir/update.json"

curl -fsS -X PUT -H "X-API-Key: $PORTAINER_TOKEN" \
  -H 'Content-Type: application/json' --data-binary @"$deploy_dir/update.json" \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID" \
  > "$deploy_dir/update-result.json"
```

Nach dem Request den Stack und die tatsaechlich laufenden Images unabhaengig erneut lesen. Bei Timeout zuerst den Zustand pruefen. Die temporaeren Dateien nach geschuetzter Uebernahme der benoetigten Sicherungen entfernen.

## Technische Pruefung nach dem Rollout

Von einem internen Zugriffspunkt Gateway-`/health/ready` und `/metrics` pruefen. Readiness prueft PostgREST und SVA Mainserver unabhaengig vom Content-Cache. Die Produktions-Compose-Datei veroeffentlicht dafuer keinen Host-Port.

Oeffentliche Smoke-Tests:

```bash
curl -fsS -o /dev/null -w 'frontend: %{http_code}\n' https://cockpit.guben.de/
curl -fsS -o /dev/null -w 'home: %{http_code}\n' https://cockpit.guben.de/api/content/home
curl -fsS -o /dev/null -w 'pois: %{http_code}\n' https://cockpit.guben.de/api/content/pois
curl -fsS -o /dev/null -w 'featured-projects: %{http_code}\n' https://cockpit.guben.de/api/content/featured-projects
curl -fsS -o /dev/null -w 'booking: %{http_code}\n' https://guben-api.smart-city-booking.de/json/default/bookables
```

Eine aktuelle Event-ID aus `/api/content/events?pageNumber=1&pageSize=1` lesen. Fuer den Detailrequest die vollstaendige ID als URL-Pfadsegment encodieren, etwa mit `jq -r '.events.results[0].id | @uri'`. Synthetische Occurrence-IDs koennen bereits Prozentzeichen enthalten; nicht manuell decodieren. Ein leerer Kalender liefert keine Detail-ID und ist separat zu bewerten.

Zusaetzlich pruefen:

- Aktuelles Event: API und HTML-Seite liefern 200, GET und HEAD stimmen ueberein.
- Bekannte abgelaufene Event-URL: HTML 404, `noindex`, keine gecachte alte Detailseite. Bei fehlgeschlagener Gateway-Pruefung HTML 503 mit `Retry-After: 60`.
- `/projects/237` und andere alte numerische Projektlinks: 302 nach `/projects`; aktuelle `featured:`-/`poi:`-Links weiter funktionsfaehig.
- Home, Projekte, Karte, Events und Buchungsseiten im Browser aufrufen. Booking-CORS aus der Ziel-Origin pruefen; ein erfolgreicher Terminalabruf belegt Browserzugriff nicht.
- Deutsch, Englisch und Polnisch pruefen. Bei `X-Translation-Pending: 1` Originaltext und automatisches Nachladen beobachten; Uebersetzungen sind keine redaktionelle Freigabe.
- Vier Kerncontainer, gewuenschte Images/Digests und fehlerfreien Start bestaetigen. `.NET`-API und alte Importer bleiben stillgelegt.

Technische Ergebnisse und fachliche Abnahme getrennt dokumentieren.

## Logs und Aufbewahrung

Die vier Cockpit-Container schreiben ueber den Unix-Socket `/run/systemd/journal.guben-cockpit/dev-log` in den Journal-Namespace `guben-cockpit`. Maximale Aufbewahrung: 14 Tage, Groessenlimit: 4 GiB, stuendliche Bereinigung. Das Groessenlimit kann auch juengere Eintraege verdraengen. Der Docker-Log-Cache ist deaktiviert; die Portainer-Containerloganzeige steht deshalb nicht zur Verfuegung.

```bash
sudo journalctl --namespace=guben-cockpit --since '14 days ago'
sudo journalctl --namespace=guben-cockpit -t guben-cockpit/guben-content-gateway-prod -f
sudo systemctl status guben-cockpit-log-retention.timer
```

Auf einem neuen Host vor dem ersten Compose-Start einrichten:

```bash
sudo install -m 0644 ops/logging/journald@guben-cockpit.conf /etc/systemd/
sudo install -m 0644 ops/logging/*.service ops/logging/*.timer /etc/systemd/system/
sudo install -m 0750 ops/logging/guben-cockpit-log-archive-retention.py /usr/local/sbin/
sudo systemctl daemon-reload
sudo systemctl enable --now guben-cockpit-logging.service
sudo systemctl enable --now guben-cockpit-log-retention.timer
```

Die globale Docker-Konfiguration bleibt unveraendert. Archivierte JSON-Logs der Erstumstellung unter `/var/lib/guben-cockpit-log-retention/archive/` werden ebenfalls nach 14 Tagen bereinigt; nicht datierbare Zeilen laufen 14 Tage nach Archivierung ab.

## Rollback

Die gesicherte vorherige Stackquelle und Umgebung einschliesslich `VERSION_WEB` und `VERSION_FRONTEND` wiederherstellen, bekannte Images/Digests verwenden und dieselben Smoke-Tests wiederholen. Ein reines App-Rollback veraendert keine Datenbankdaten.

Keine Volumes loeschen und kein allgemeines Pruning ausfuehren. `guben-api-prod` wird durch einen normalen Rollback nicht wieder eingefuehrt. Das erhaltene Volume `cockpit_api-data-protection-keys` ist ausschliesslich historischer Rollback-Bestand; Details in der [Stilllegungsdokumentation](legacy-api-retirement.md).
