# Release-Verfahren

Stand: 12. November 2026. Abgeglichen mit GitHub und `.github/workflows/release-prod.yml`; der Portainer-Stand wurde am selben Tag lesend anhand von Stack-Umgebung und laufenden Image-Metadaten geprueft.

## Ausgangsstand vor der Release-Aktualisierung am 12. November 2026

Der gepflegte Standardbranch ist `dev`. `main` ist ein historischer Branch und kein verlaesslicher Ausgangspunkt fuer den naechsten Release.

| Stand beim Abgleich | Nachweis |
| --- | --- |
| `dev` / lokaler Ausgangsstand | `1a15a84`, 7. November 2026 |
| Neuester regulaerer Tag | `v0.8.49`, Commit `8ce7c44`, 30. Oktober 2026 |
| Image-Build fuer `v0.8.49` | [erfolgreicher Workflow](https://github.com/smart-village-solutions/guben-cockpit-old/actions/runs/41135339687) |
| Letzter Eintrag unter GitHub Releases | `v0.8.17`, 22. Juni 2026 |

Zwischen `v0.8.49` und `1a15a84` liegen 11 Commits einschliesslich Merge-Commits: Log-Aufbewahrung, Importer-/API-Stilllegung, Event-HTTP-Status und alte Projektlinks. Diese Tabelle ist ein datierter Vergleich, keine automatisch aktualisierte Versionsanzeige.

## Gepruefter Portainer-Stand am 12. November 2026

| Komponente | Laufendes Image | Image-Revision |
| --- | --- | --- |
| Frontend | `guben-cockpit-web:v0.8.49-legacy-project-links.1` | `7ea03439c25fcdf7ef6bfa7dc0656a705fa30dd0` |
| Content-Gateway | `guben-cockpit-content-gateway:v0.8.49` | `8ce7c441c68c84f8b026446371365c501d16cae1` |
| PostgREST | `postgrest/postgrest:v12.2.8` | Upstream-Image |
| PostgreSQL | `postgres:17` | Upstream-Image |

Alle vier Container waren beim Abgleich `running`. Die Stack-Umgebung enthaelt `VERSION_WEB=v0.8.49` und `VERSION_FRONTEND=v0.8.49-legacy-project-links.1`. Das Frontend liegt damit ueber dem regulaeren Basis-Tag, ohne dass dafuer ein neuer regulaerer Repository-Tag oder GitHub Release existiert. Die OCI-Revision des Frontend-Images ordnet es der Projektlink-Korrektur zu; die uebernommene OCI-Erstellungszeit ist kein verlaesslicher Nachweis fuer den Zeitpunkt des Spezialbuilds.

Manifest-Digests beim Abgleich:

- Web: `sha256:3cf7df43a909ae37b393a11025169fe2e1ca0fc9567347bef6c48fe8cabc1d94`
- Gateway: `sha256:244dad444166a4da17f8ff8e5decee6a537b062905880ccabb450947f1367f84`

Diese Bestandsaufnahme bestaetigt Versionswerte und laufende Images; sie ist keine neue fachliche Abnahme. Ein neuer regulaerer Release aendert diesen Produktivstand erst nach einem gesonderten Rollout.

Die Paketversionen (`0.0.0` im Root/Frontend und `0.1.0` im Gateway) steuern den Release nicht. Massgeblich sind Git-Tag, Commit und die daraus gebauten Images.

## Was der Workflow ausfuehrt

Ein gepushter Tag mit Muster `v*.*.*` startet `release-prod.yml`. Der Job nutzt das GitHub-Environment `main`; dieser Environment-Name bezeichnet nicht den Quellbranch.

Der Workflow baut und publiziert:

- `ghcr.io/smart-village-solutions/guben-cockpit-web`
- `ghcr.io/smart-village-solutions/guben-cockpit-content-gateway`

Er erzeugt keinen Eintrag unter GitHub Releases und fuehrt keinen Portainer-Rollout aus. Das Frontend-Image installiert Abhaengigkeiten und enthaelt den Quellcode; Build und Prerender erfolgen beim Containerstart. Ein erfolgreicher Image-Build belegt daher noch keinen erfolgreichen Frontend-Start.

## Naechsten Release vorbereiten

1. Aktuellen Remote-Stand laden und einen sauberen Checkout des gewuenschten `dev`-Commits verwenden. Neue Aenderungen zuerst per PR pruefen und zusammenfuehren.
2. Diff seit dem letzten regulaeren Tag und vorhandene Tags pruefen. Die naechste freie Version waehlen; bestehende Tags nicht verschieben.
3. Abhaengigkeiten in `shared`, `content-gateway`, `frontend` und `postgrest` jeweils mit `npm ci --prefix <directory>` installieren.
4. Die aktuellen PR-Checks in `build.yml` und `sonar.yml` fuer den exakten Release-Commit pruefen. `npm test`, Gateway-Lint/Typecheck/Build und Frontend-Contract-/Prerender-Pruefungen sind die lokalen Einstiegspunkte. Der Contract-/Prerender-Test braucht ein erreichbares Gateway; CI verwendet `CONTENT_SOURCE_MODE=mock`.
5. Release Notes aus den fachlich relevanten Aenderungen erstellen. Betriebsanforderungen, Legacy-Stilllegung und Versions-Overrides mit auffuehren. Dokumentation und Links pruefen.
6. Vor Tagging sicherstellen, dass der ausgewaehlte Commit auch die freigegebenen Dokumentationsaenderungen enthaelt.

Lesende Pruefbefehle:

```bash
git status --short --branch
git tag --sort=-version:refname
git log --oneline v0.8.49..HEAD
gh release list
gh run list --workflow release-prod.yml --limit 10
```

## Veroeffentlichung und Rollout

Nach Freigabe den ausgewaehlten Commit mit einem annotierten Versionstag versehen und diesen gezielt pushen. Anschliessend:

1. Den zum Tag gehoerenden Workflow bis zum erfolgreichen Abschluss verfolgen; Commit, Tag, Image-Referenzen und Digests festhalten.
2. Einen GitHub Release zu genau diesem Tag mit den vorbereiteten Release Notes anlegen. Aeltere Tags koennen bei Bedarf mit datierten Release Notes nachdokumentiert werden; dabei keine damalige Produktionsabnahme behaupten.
3. Nach dem [Deploy-Runbook](deploy-runbook.md) ausrollen. Insbesondere `VERSION_FRONTEND` pruefen: Ein alter Override ueberlagert einen neuen `VERSION_WEB`-Wert.
4. Laufende Images/Digests und die technischen Smoke-Tests dokumentieren. Die fachliche Abnahme separat festhalten.

Ein GitHub Release kann ohne Deployment existieren. Ein publiziertes Image, ein technisch gepruefter Rollout und eine fachlich abgenommene Version sind jeweils eigene Nachweise.
