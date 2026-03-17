# Deploy Runbook (Prod)

Dieses Runbook beschreibt den Standard-Deploy fuer `cockpit.guben.de` ueber Portainer inkl. Troubleshooting und Rollback.

## Notfall in 2 Minuten

Schnellablauf fuer akute Stoerungen oder dringende Releases.

1. Zielversion setzen:

```bash
export TARGET_WEB_VERSION=v0.8.6
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
jq '.Env | map(if .name=="VERSION_WEB" then .value=env.TARGET_WEB_VERSION else . end)' \
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
curl -fsS -o /dev/null -w "booking/default/bookables: %{http_code}\n" https://cockpit.guben.de/api/booking/html/default/bookables
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
   - `INTERNAL_BOOKING_URL=https://backend.booking.guben.de`
   - `VITE_CONTENT_GATEWAY_URL=${FRONTEND_BASEURI}`
   - `VITE_BOOKING_URL=/api/booking`
3. In `Environment variables` setzen:
   - `VERSION_WEB=<zieltag>`
   - `VERSION_API=<bestehender API-Tag>` (nur aendern, wenn API-Release geplant)
4. `Update the stack` ausfuehren

## 3. Deploy (Portainer API, optional)

```bash
PORTAINER_URL='https://<portainer-host>:9443'
PORTAINER_TOKEN='<api-token>'
PORTAINER_STACK_ID='<stack-id>'
PORTAINER_ENDPOINT_ID='<endpoint-id>'

curl -fsS -H "X-API-Key: $PORTAINER_TOKEN" \
  "$PORTAINER_URL/api/stacks/$PORTAINER_STACK_ID?endpointId=$PORTAINER_ENDPOINT_ID" > /tmp/p-stack-now.json

# Env anpassen (Beispiel mit jq)
jq '.Env | map(if .name=="VERSION_WEB" then .value="v0.8.6" else . end)' \
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
curl -fsS -o /dev/null -w "booking/default/bookables: %{http_code}\n" https://cockpit.guben.de/api/booking/html/default/bookables
```

Erwartung: jeweils `200`.

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
5. Drei Smoke-Endpunkte liefern `200`
6. Bei Problemen: gezielter Rollback auf letzten stabilen `VERSION_WEB`
