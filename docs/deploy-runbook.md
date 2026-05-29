# Deploy Runbook (Prod)

Dieses Runbook beschreibt den Standard-Deploy fuer `cockpit.guben.de` ueber Portainer inkl. Troubleshooting und Rollback.

## Notfall in 2 Minuten

Schnellablauf fuer akute Stoerungen oder dringende Releases.

1. Zielversion setzen:

```bash
export TARGET_WEB_VERSION=v0.8.6
export TARGET_SV_GRAPHQL_URL='https://smart-village.example.com/graphql'
export TARGET_SV_OAUTH_TOKEN_URL='https://smart-village.example.com/oauth/token'
export TARGET_SV_CLIENT_ID='<smart-village-client-id>'
export TARGET_SV_CLIENT_SECRET='<smart-village-client-secret>'
export PORTAINER_URL='https://<portainer-host>:9443'
export PORTAINER_TOKEN='<api-token>'
export PORTAINER_STACK_ID='<stack-id>'
export PORTAINER_ENDPOINT_ID='<endpoint-id>'
```

2. Stack-Status laden:

```bash
curl -fsS -H "X-API-Key: $PORTAINER_TOKEN" \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID" > /tmp/p-stack-now.json
```

3. Env fuer Deploy bauen:

```bash
jq '
  def upsert_env($name; $value):
    if any(.[]; .name == $name) then
      map(if .name == $name then .value = $value else . end)
    else
      . + [{name: $name, value: $value}]
    end;
  .Env
  | upsert_env("VERSION_WEB"; env.TARGET_WEB_VERSION)
  | upsert_env("SV_GRAPHQL_URL"; env.TARGET_SV_GRAPHQL_URL)
  | upsert_env("SV_OAUTH_TOKEN_URL"; env.TARGET_SV_OAUTH_TOKEN_URL)
  | upsert_env("SV_CLIENT_ID"; env.TARGET_SV_CLIENT_ID)
  | upsert_env("SV_CLIENT_SECRET"; env.TARGET_SV_CLIENT_SECRET)
' \
  /tmp/p-stack-now.json > /tmp/p-env.json
```

4. Update absenden:

```bash
jq -n \
  --arg content "$(cat stack.prod.yml)" \
  --argjson env "$(cat /tmp/p-env.json)" \
  '{stackFileContent:$content, env:$env, prune:true, pullImage:true}' \
  > /tmp/p-update.json

curl -fsS -X PUT \
  -H "X-API-Key: $PORTAINER_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/p-update.json \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID"
```

5. Wenn `denied`: Images vorpullen und erneut deployen (dann `pullImage:false`).

6. Smoke-Test:

```bash
curl -fsS -o /dev/null -w "frontend: %{http_code}\n" https://cockpit.guben.de/
curl -fsS -o /dev/null -w "content/home: %{http_code}\n" https://cockpit.guben.de/api/content/home
curl -fsS -o /tmp/content-events.json -w "content/events: %{http_code}\n" "https://cockpit.guben.de/api/content/events?pageNumber=1&pageSize=1"
EVENT_ID="$(jq -r '.events.results[0].id' /tmp/content-events.json)"
test "$EVENT_ID" != "null"
curl -fsS -o /dev/null -w "content/event-detail: %{http_code}\n" "https://cockpit.guben.de/api/content/events/$EVENT_ID"
curl -fsS -o /dev/null -w "booking-api/default/bookables: %{http_code}\n" https://guben-api.smart-city-booking.de/api/default/bookables/public
```

Rollback sofort: `TARGET_WEB_VERSION` auf letzten stabilen Tag setzen und Schritte 3-6 wiederholen.

## Scope

- Stack: `cockpit`
- Produktions-Compose: `stack.prod.yml`
- Wichtige Images:
  - `ghcr.io/smart-village-solutions/guben-cockpit-web:<tag>`
  - `ghcr.io/smart-village-solutions/guben-cockpit-content-gateway:<tag>`
  - `ghcr.io/agriculturedev/guben-cockpit-api:<tag>`

## Voraussetzungen

- GitHub Tag fuer Release ist gepusht (z. B. `v0.8.6`)
- GitHub Action fuer Image-Build ist erfolgreich
- Portainer-URL, Stack-ID und Endpoint-ID liegen aus der privaten Betriebsdokumentation oder direkt aus Portainer vor
- Die Smart-Village-Zugangsdaten fuer den Event-Cutover liegen vor:
  - `SV_GRAPHQL_URL`
  - `SV_OAUTH_TOKEN_URL`
  - `SV_CLIENT_ID`
  - `SV_CLIENT_SECRET`
- In Portainer existieren lauffaehige GHCR-Registries mit passenden Accounts:
  - fuer `smart-village-solutions/*`
  - fuer `agriculturedev/*`

## TLS-Hinweis

Die `curl`-Beispiele gehen von gueltig vertrauenswuerdigen Zertifikaten aus und verwenden bewusst kein `-k`.

Wenn Portainer ueber eine interne CA oder ein Self-Signed-Zertifikat abgesichert ist, sollte das Zertifikat lokal vertraut oder gezielt per `--cacert /pfad/zur/ca.pem` uebergeben werden.

## 1. Pre-Deploy Checks

1. Lokal verifizieren:

```bash
cd frontend
npm run typecheck
```

2. Release-Tag pruefen:

```bash
git tag --list | tail -n 20
```

3. Build-Status pruefen:

```bash
gh run list --workflow "Build and push Docker image on tag" --limit 10
```

4. Optionale Manifest-Pruefung:

```bash
docker manifest inspect ghcr.io/smart-village-solutions/guben-cockpit-web:v0.8.6 >/dev/null
docker manifest inspect ghcr.io/smart-village-solutions/guben-cockpit-content-gateway:v0.8.6 >/dev/null
```

## 2. Deploy (Portainer UI)

1. Portainer -> `Stacks` -> `cockpit` -> `Editor`
2. Sicherstellen, dass `stack.prod.yml` folgende Web-Umgebung enthaelt:
   - `PRERENDER_CONTENT_GATEWAY_URL=http://content-gateway:5100`
   - `INTERNAL_CONTENT_GATEWAY_URL=http://content-gateway:5100`
   - `INTERNAL_BOOKING_URL=https://backend.booking.guben.de` fuer die noch nicht migrierten Legacy-Event-Flows
   - `VITE_CONTENT_GATEWAY_URL=${FRONTEND_BASEURI}`
   - `VITE_BOOKING_API_URL=https://guben-api.smart-city-booking.de`
   - `VITE_BOOKING_URL=/api/booking` fuer die noch nicht migrierten Legacy-Event-Flows
3. In `Environment variables` setzen:
  - `VERSION_WEB=<zieltag>`
  - `VERSION_API=<bestehender API-Tag>` (nur aendern, wenn API-Release geplant)
  - `SV_GRAPHQL_URL=<smart-village-graphql-url>`
  - `SV_OAUTH_TOKEN_URL=<smart-village-oauth-token-url>`
  - `SV_CLIENT_ID=<smart-village-client-id>`
  - `SV_CLIENT_SECRET=<smart-village-client-secret>`
4. `Update the stack` ausfuehren

## 3. Deploy (Portainer API, optional)

```bash
PORTAINER_URL='https://<portainer-host>:9443'
PORTAINER_TOKEN='<api-token>'
PORTAINER_STACK_ID='<stack-id>'
PORTAINER_ENDPOINT_ID='<endpoint-id>'
TARGET_WEB_VERSION='v0.8.6'
TARGET_SV_GRAPHQL_URL='https://smart-village.example.com/graphql'
TARGET_SV_OAUTH_TOKEN_URL='https://smart-village.example.com/oauth/token'
TARGET_SV_CLIENT_ID='<smart-village-client-id>'
TARGET_SV_CLIENT_SECRET='<smart-village-client-secret>'

curl -fsS -H "X-API-Key: $PORTAINER_TOKEN" \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID" > /tmp/p-stack-now.json

# Env fuer den Cutover-Stack sicher aktualisieren oder anlegen
jq '
  def upsert_env($name; $value):
    if any(.[]; .name == $name) then
      map(if .name == $name then .value = $value else . end)
    else
      . + [{name: $name, value: $value}]
    end;
  .Env
  | upsert_env("VERSION_WEB"; env.TARGET_WEB_VERSION)
  | upsert_env("SV_GRAPHQL_URL"; env.TARGET_SV_GRAPHQL_URL)
  | upsert_env("SV_OAUTH_TOKEN_URL"; env.TARGET_SV_OAUTH_TOKEN_URL)
  | upsert_env("SV_CLIENT_ID"; env.TARGET_SV_CLIENT_ID)
  | upsert_env("SV_CLIENT_SECRET"; env.TARGET_SV_CLIENT_SECRET)
' \
  /tmp/p-stack-now.json > /tmp/p-env.json

jq -n \
  --arg content "$(cat stack.prod.yml)" \
  --argjson env "$(cat /tmp/p-env.json)" \
  '{stackFileContent:$content, env:$env, prune:true, pullImage:true}' \
  > /tmp/p-update.json

curl -fsS -X PUT \
  -H "X-API-Key: $PORTAINER_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/p-update.json \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID"
```

## 4. Post-Deploy Smoke Tests

```bash
curl -fsS -o /dev/null -w "frontend: %{http_code}\n" https://cockpit.guben.de/
curl -fsS -o /dev/null -w "content/home: %{http_code}\n" https://cockpit.guben.de/api/content/home
curl -fsS -o /tmp/content-events.json -w "content/events: %{http_code}\n" "https://cockpit.guben.de/api/content/events?pageNumber=1&pageSize=1"
EVENT_ID="$(jq -r '.events.results[0].id' /tmp/content-events.json)"
test "$EVENT_ID" != "null"
curl -fsS -o /dev/null -w "content/event-detail: %{http_code}\n" "https://cockpit.guben.de/api/content/events/$EVENT_ID"
curl -fsS -o /dev/null -w "booking-api/default/bookables: %{http_code}\n" https://guben-api.smart-city-booking.de/api/default/bookables/public
```

Erwartung: jeweils `200`.

Hinweis zum Event-Detail-Smoke-Test:
- Die Event-IDs kommen seit dem Smart-Village-Cutover als synthetische Occurrence-IDs zurueck, z. B. `1937530:2026-06-14:10%3A00`.
- Wenn eine ID manuell in eine URL kopiert wird, muss sie URL-encodiert bleiben. Der Ablauf oben liest bereits die encodierte ID aus der Listen-Response.

Browser-/CORS-Check fuer den Booking-Rollout:

```js
await fetch("https://guben-api.smart-city-booking.de/api/default/bookables/public", {
  headers: { Accept: "application/json" },
}).then((response) => response.ok)
```

Diesen Check vor Rollout einmal aus einer lokalen Frontend-Origin und einmal aus einer deployten Zielumgebung im Browser ausfuehren.

Hinweis zum Booking-Link:
- Die Smart-City-Booking-API liefert fuer Bookables aktuell keinen fertigen `bookingUrl`.
- Das Frontend konstruiert deshalb den Portal-Link deterministisch aus `VITE_BOOKING_API_URL`, indem der API-Host auf den User-Host abgebildet und `tenantId` plus `bookableId` als Query-Parameter uebergeben werden.

Zusatzcheck Container:

```bash
curl -fsS -H "X-API-Key: $PORTAINER_TOKEN" \
  "$PORTAINER_URL/api/endpoints/$PORTAINER_ENDPOINT_ID/docker/containers/json?all=1" | \
  jq -r '.[] | select(([.Names[]] | join(" ") | test("guben-(web|api|db|postgrest|content-gateway)-prod"))) | [.Names[0], .Image, .State] | @tsv'
```

## 5. Troubleshooting

### Fehler: `denied` beim Deploy

Ursache: Mindestens ein referenziertes Image kann nicht gezogen werden (oft Registry/Namespace-Mismatch).

Vorgehen:

1. Gezielte Pull-Tests pro Image ausfuehren.
2. Bei mehreren GHCR-Registries ggf. Image manuell mit passender Registry-ID pullen.
3. Danach Stack-Update mit `pullImage:false` erneut ausfuehren.

Beispiel manuelles Pullen via Portainer Docker API:

```bash
# X-Registry-Auth ist Base64 von {"registryId": <id>}
curl -fsS -X POST \
  -H "X-API-Key: $PORTAINER_TOKEN" \
  -H "X-Registry-Auth: <base64-json>" \
  "$PORTAINER_URL/api/endpoints/$PORTAINER_ENDPOINT_ID/docker/images/create?fromImage=ghcr.io/agriculturedev/guben-cockpit-api&tag=v0.7.3"
```

### Fehlerbild: Env-Eintraege mit `:` im Namen

Beispiel falsch:

- `PRERENDER_CONTENT_GATEWAY_URL: http://content-gateway:5100` als `name`

Dann wurden YAML-Zeilen als Env-Key serialisiert. Diese Eintraege entfernen und korrekt als Key/Value hinterlegen:

- `name=PRERENDER_CONTENT_GATEWAY_URL`, `value=http://content-gateway:5100`
- `name=INTERNAL_CONTENT_GATEWAY_URL`, `value=http://content-gateway:5100`
- `name=VITE_CONTENT_GATEWAY_URL`, `value=${FRONTEND_BASEURI}`

## 6. Rollback

Wenn Smoke-Tests fehlschlagen:

1. `VERSION_WEB` auf letzten stabilen Tag setzen (z. B. `v0.8.5`)
2. Stack erneut deployen
3. Container-Status und Smoke-Tests wiederholen

Rollback via API (Kurzform):

```bash
# analog Deploy, nur VERSION_WEB zuruecksetzen
```

## 7. Checkliste fuer Releases

1. Tag gebaut und in GHCR verfuegbar
2. Portainer-Registries fuer alle benoetigten Namespaces verifiziert
3. Stack mit korrekten Env-Variablen aktualisiert
4. Alle 5 Kerncontainer laufen (`web`, `api`, `db`, `postgrest`, `content-gateway`)
5. Frontend, Home, Event-Liste, Event-Detail und Booking-Smoke-Checks liefern `200`
6. Bei Problemen: gezielter Rollback auf letzten stabilen `VERSION_WEB`
