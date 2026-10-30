# SonarCloud-Korrekturen vom 30.10.2026

Projekt: `smart-village-solutions_guben-cockpit-old`, Statusfilter OPEN/CONFIRMED.
Der vollständig geladene API-Snapshot enthielt 234 Issues. Bearbeitet wurden alle 144 Issues mit höchstem Impact BLOCKER (1), HIGH (12) oder MEDIUM (131).

Die Änderungen liegen auf `fix/sonar-blocker-high-medium`. Drei Subagenten bearbeiteten getrennte Dateibereiche. Keine Regeln wurden abgeschaltet und keine Findings unterdrückt. Die Änderungen werden in PR #67 gegen `dev` geprüft. Es erfolgten kein Deployment und keine Änderung von SonarCloud-Statuswerten. Die endgültige Auflösung muss ein neuer SonarCloud-Scan bestätigen.

## Nachbesserung nach erstem CI-Lauf von PR #67

Der erste Build scheiterte an `@typescript-eslint/no-unused-vars`: Der ungenutzte Locale-Parameter von `getFeaturedProjects` wird nun nur in der öffentlichen Overload-Signatur geführt; die Implementierung benötigt keinen Parameter. Der tatsächliche Gateway-Lintcheck, Typecheck und alle 144 Gateway-Tests bestanden danach.

Das erste Sonar-Gate meldete 69,5 % Coverage für neuen Code bei geforderten 80 %. Ergänzende Verhaltenstests prüfen Ticket-Parsing mit realistischen HTML-Fixtures, Übersetzungsbereitschaft, Dialogzustände, Tabellenzustände, Datei-Identität nach Entfernen/Umsortieren und Carousel-Bedienung. Das zusätzliche React-Finding `S6754` wird durch die tatsächlich verwendete Übersetzungsbereitschaft in `aria-busy` behoben. Coverage-Grenzen und Analyseumfang bleiben unverändert. Frontend-Typecheck, Gateway-Lint/Typecheck und der CI-konfigurierte Frontend-Build samt Gateway-Vertragsprüfung und Prerendering sind lokal erfolgreich. Der vollständige lokale CI-Coverage-Lauf besteht mit 351 Tests (Shared 12, Gateway 144, Frontend 194, PostgREST 1).

## Gemeinsame Validierung

Unter Node 22.19.0 bestanden:

- `npm test`: Shared 12, Gateway 144, Frontend 178 und PostgREST-Smoke 1; insgesamt 335 Tests.
- `npm --prefix frontend run typecheck`.
- `npm --prefix content-gateway run build` (einschließlich TypeScript-Prüfung).
- Frontend SPA-Build und Übersetzungsprüfung.
- Prerendering und `verify:prerender` mit temporärem lokalen Gateway im Mock-Modus. Der erste Prerender-Versuch ohne laufenden Gateway scheiterte erwartbar an ECONNREFUSED; mit lokalem Gateway erfolgreich. Keine Prüfung gegen produktive Inhaltsdaten.
- `git diff --check`.
- Ergänzender lokaler Scan der betroffenen TypeScript-Dateien mit eslint-plugin-sonarjs 4.2.2: keine Findings der elf abgedeckten Sonar-Regeln, einschließlich Komplexität, verschachtelten Funktionen/Ternaries, redundanter Optionalität und fehlender Testassertionen. Ergänzende React-/Promise-Regeln ohne Findings. Ein zusätzlicher, vorbestehender jsx-a11y/prefer-tag-over-role-Hinweis auf den Combobox-Button in MultiComboBox bleibt außerhalb der 144 zugewiesenen Findings bestehen. Der lokale Scan ersetzt keinen SonarCloud-Scan.

Die folgenden Einzelberichte dokumentieren die ursprünglichen Issue-Keys und ihre Korrekturen. Ihre Zwischenstandshinweise zu parallelen Änderungen werden durch die gemeinsame Validierung oben ersetzt.

## Content-Gateway

# Content gateway Sonar remediation

All 58 assigned issues addressed in source. No rules disabled or findings suppressed. SonarCloud resolution requires a new server analysis; no server-side statuses were edited.

Validation (Node v22.19.0):
- npm --prefix content-gateway run typecheck: PASS
- npm --prefix content-gateway test: PASS, 23 files / 144 tests
- Added two request-json regression cases: no retries for HTTP 404; retry network errors through final normalized failure.
- Existing route, readiness, metrics, repository, POI and featured project tests remain green.

| Issue | Rule | Resolution |
| --- | --- | --- |
| AaGN-54Gb13Y7R6SmV1Q | typescript:S3358 | Separate title-order and ID tie-break comparisons with early returns. |
| AaGH5SMGS2GXTwzn7aHx | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AZ_NbPeKQ1c1ZD3s-rHT | typescript:S3735 | Unused language parameter explicitly named _language; removed void expression. |
| AZ_NbPeKQ1c1ZD3s-rHU | typescript:S3735 | Unused language parameter explicitly named _language; removed void expression. |
| AaGH5SMGS2GXTwzn7aHw | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aHy | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aHz | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AZ_M69sie9_Gmj1XNJ2j | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2k | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2l | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2m | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2o | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2p | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2q | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2r | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2s | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2t | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2u | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2v | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2w | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2x | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2y | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2z | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ20 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ21 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ22 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ23 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ24 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ25 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ26 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ27 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ28 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2- | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ29 | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ2_ | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ3A | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ3B | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ3C | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ3D | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AZ_M69sie9_Gmj1XNJ3E | typescript:S4782 | Removed undefined from OptionalString; optional properties retain absence through ?. |
| AaGH5SMGS2GXTwzn7aH7 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SL8S2GXTwzn7aHt | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH0 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMMS2GXTwzn7aH8 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMQS2GXTwzn7aH9 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMQS2GXTwzn7aH- | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMQS2GXTwzn7aH_ | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMQS2GXTwzn7aIA | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aHu | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aHv | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH1 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH2 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH3 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH4 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH5 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AaGH5SMGS2GXTwzn7aH6 | typescript:S7503 | Replaced async without await with explicit Promise returns, synchronous route handlers or callback hooks. Parsing remains inside a Promise callback to preserve rejected-error contracts. |
| AZ14rsbhTiMI7OSQERfN | typescript:S4043 | Sort dropdown rows as a separate statement before mapping, preserving existing ordering and mutation semantics. |
| AZ14rsbYTiMI7OSQERfM | typescript:S3776 | Extracted gateway-error normalization from retry loop; retained timeout classification, retry policy, backoff and cleanup. |


## Frontend-Fachlogik

# Frontend Core: 47 Findings bearbeitet

Alle 47 zugewiesenen Findings im Quellcode behoben; keine Suppressionen oder Regelabschaltungen. Remote-SonarCloud-Auflösung ist erst nach neuem Scan bestätigt.

## Validierung

- Node 22.19.0 verwendet.
- Frontend typecheck bestanden (vor zusätzlicher rein typgesicherter Key-Änderung für Öffnungszeiten); Gesamtintegration prüft erneut.
- 7 gezielte Testdateien, 42 Tests bestanden: GatewayProjectsPage, GatewayEventDetailPage, GatewayProjectDetailPage, eventPageUtils, booking-api/mappers, routeCoverage, contentKeys.
- Lokaler SonarJS-Scan: für S3776/S3358/S2004 und weitere zugewiesene Regeln keine Core-Findings. Zusätzliches react/no-array-index-key für vorbestehende openingHours wurde nach Scan ebenfalls beseitigt.
- git diff --check bestanden.
- Vorbestehende Testwarnungen: Radix useLayoutEffect bei SSR und veraltete Browserslist-Daten.

## Issue-Zuordnung

- `AaGMO8i_ctnWyOPLT2FT` (typescript:S4624, `frontend/src/booking-api/mappers.ts`): Formatierte Gebühren und Einheiten vor dem äußeren Template berechnet.
- `AaGMO8i_ctnWyOPLT2FU` (typescript:S4624, `frontend/src/booking-api/mappers.ts`): Formatierte Gebühren und Einheiten vor dem äußeren Template berechnet.
- `AaDm2jG5AQ53IhMwpqFI` (typescript:S6479, `frontend/src/components/booking/priceCard.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AaAzt7x7oib3IMj32mCA` (typescript:S3358, `frontend/src/components/events/eventCard.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AaAzt70Poib3IMj32mCB` (typescript:S3776, `frontend/src/components/events/eventPageUtils.ts`): Komplexe Darstellung in fokussierte Komponenten geteilt bzw. Filterdistanz in eine eigene Funktion extrahiert und Enum-Fallback abgeflacht.
- `AaAzt722oib3IMj32mCC` (typescript:S3776, `frontend/src/components/public-content/GatewayEventDetailPage.tsx`): Komplexe Darstellung in fokussierte Komponenten geteilt bzw. Filterdistanz in eine eigene Funktion extrahiert und Enum-Fallback abgeflacht.
- `AZ_M69lJe9_Gmj1XNJ2b` (typescript:S3776, `frontend/src/components/public-content/GatewayProjectDetailPage.tsx`): Komplexe Darstellung in fokussierte Komponenten geteilt bzw. Filterdistanz in eine eigene Funktion extrahiert und Enum-Fallback abgeflacht.
- `AZ_M69mAe9_Gmj1XNJ2c` (typescript:S3776, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Komplexe Darstellung in fokussierte Komponenten geteilt bzw. Filterdistanz in eine eigene Funktion extrahiert und Enum-Fallback abgeflacht.
- `AZ_M69mAe9_Gmj1XNJ2d` (typescript:S3358, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ_M69mAe9_Gmj1XNJ2e` (typescript:S3358, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ_M69mAe9_Gmj1XNJ2f` (typescript:S3358, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ_M69mAe9_Gmj1XNJ2g` (typescript:S6479, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ_M69mAe9_Gmj1XNJ2h` (typescript:S3358, `frontend/src/components/public-content/GatewayProjectsPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ_M69o_e9_Gmj1XNJ2i` (typescript:S3358, `frontend/src/routes/projects/index.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ7wpDDbtqcQ6bfjpsKu` (typescript:S3358, `frontend/src/components/events/eventCard.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ7wpDFNtqcQ6bfjpsKz` (typescript:S3358, `frontend/src/components/public-content/GatewayEventDetailPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ51cXoCGzJsVDTR0zOe` (typescript:S3776, `frontend/src/utilities/enumUtils.ts`): Komplexe Darstellung in fokussierte Komponenten geteilt bzw. Filterdistanz in eine eigene Funktion extrahiert und Enum-Fallback abgeflacht.
- `AaGH5SLiS2GXTwzn7aHq` (typescript:S9383, `frontend/src/utilities/i18n/initializeTranslations.ts`): Bewusst nicht abgewartete Aufrufe mit void markiert; bestehende Fehlerbehandlung erhalten.
- `AZ18hpDis0Fbzs2jF4GX` (typescript:S2699, `frontend/src/routeCoverage.test.tsx`): Importierte Route-Module werden jetzt ausdrücklich auf exportierte Route-Verträge geprüft.
- `AZ18hpBUs0Fbzs2jF4GN` (typescript:S1854, `frontend/src/routes/booking/index.lazy.tsx`): Ungenutzte Bindung entfernt; benötigten Hook-Aufruf bzw. Setter erhalten.
- `AZ18hpBUs0Fbzs2jF4GP` (typescript:S6479, `frontend/src/routes/booking/index.lazy.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ18hpBUs0Fbzs2jF4GQ` (typescript:S6479, `frontend/src/routes/booking/index.lazy.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ18hpBUs0Fbzs2jF4GR` (typescript:S6479, `frontend/src/routes/booking/index.lazy.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AaGH5SIZS2GXTwzn7aHo` (typescript:S9383, `frontend/src/components/booking/bookingCard.tsx`): Bewusst nicht abgewartete Aufrufe mit void markiert; bestehende Fehlerbehandlung erhalten.
- `AZ14rsT7TiMI7OSQERcJ` (typescript:S3358, `frontend/src/components/booking/bookingComponent.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ14rsV1TiMI7OSQERcg` (typescript:S1854, `frontend/src/components/events/eventCard.tsx`): Ungenutzte Bindung entfernt; benötigten Hook-Aufruf bzw. Setter erhalten.
- `AZ14rsXITiMI7OSQERc9` (typescript:S3358, `frontend/src/components/public-content/GatewayEventsPage.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AZ14rsX7TiMI7OSQERdQ` (typescript:S6479, `frontend/src/components/layout/Footer.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsUETiMI7OSQERcL` (typescript:S6479, `frontend/src/components/booking/bookingRoom.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsXmTiMI7OSQERdG` (typescript:S1854, `frontend/src/components/public-content/GatewayEventDetailPage.tsx`): Ungenutzte Bindung entfernt; benötigten Hook-Aufruf bzw. Setter erhalten.
- `AZ14rsXmTiMI7OSQERdL` (typescript:S6479, `frontend/src/components/public-content/GatewayEventDetailPage.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsXITiMI7OSQERc-` (typescript:S6479, `frontend/src/components/public-content/GatewayEventsPage.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ_Hk59FQCr2rwIJKAO4` (typescript:S2004, `frontend/src/components/events/eventIntegration.tsx`): Ticket-Parsing einschließlich Flags und Preiszeilen aus verschachtelten Fetch-Callbacks in parseTicket auf Modulebene extrahiert.
- `AZ_Hk59FQCr2rwIJKAO5` (typescript:S2004, `frontend/src/components/events/eventIntegration.tsx`): Ticket-Parsing einschließlich Flags und Preiszeilen aus verschachtelten Fetch-Callbacks in parseTicket auf Modulebene extrahiert.
- `AZ14rsbPTiMI7OSQERfH` (typescript:S3504, `frontend/src/main.tsx`): Lokale Matomo-Scriptvariablen auf const umgestellt; window._mtm bleibt als globaler Vertrag erhalten.
- `AZ14rsbPTiMI7OSQERfL` (typescript:S3504, `frontend/src/main.tsx`): Lokale Matomo-Scriptvariablen auf const umgestellt; window._mtm bleibt als globaler Vertrag erhalten.
- `AZ14rsYyTiMI7OSQERdi` (typescript:S6479, `frontend/src/components/home/DashboardDropdownNav.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsWqTiMI7OSQERct` (typescript:S3358, `frontend/src/components/projects/projectDialog.tsx`): Verzweigung in Hilfsfunktion oder eigenständige Darstellungskomponente extrahiert; bei ProjectDialog den unerreichbaren Carousel-Zweig der konstant leeren imageObjects entfernt.
- `AaGH5SKbS2GXTwzn7aHp` (typescript:S9383, `frontend/src/components/events/eventIntegration.tsx`): Bewusst nicht abgewartete Aufrufe mit void markiert; bestehende Fehlerbehandlung erhalten.
- `AZ14rsayTiMI7OSQERer` (typescript:S6397, `frontend/src/lib/DefaultEventImage.ts`): Einzelzeichenklasse ß durch Literal ersetzt.
- `AZ14rsayTiMI7OSQERet` (typescript:S6535, `frontend/src/lib/DefaultEventImage.ts`): Überflüssiges Slash-Escape in Zeichenklasse entfernt.
- `AZ14rsUPTiMI7OSQERcP` (typescript:S6479, `frontend/src/components/booking/bookingHowItWorks.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsVLTiMI7OSQERcd` (typescript:S6844, `frontend/src/components/events/citizenInformationSystemBanner.tsx`): DialogTrigger ist direkt der native Button mit Unterstreichung; href-losen inneren Anchor entfernt.
- `AZ14rsX7TiMI7OSQERdP` (typescript:S6479, `frontend/src/components/layout/Footer.tsx`): Array-Index durch Domänen-ID ersetzt; Preis-/Öffnungszeitzeilen ohne Provider-ID verwenden inhaltsbasierte Schlüssel mit stabiler Duplikat-Occurrence. Skeletons verwenden feste benannte Platzhalter-Slots.
- `AZ14rsaPTiMI7OSQEReW` (javascript:S7772, `frontend/src/utilities/i18n/CheckTranslations.cjs`): Node-Builtin-Import auf node:fs bzw. node:path geändert.
- `AZ14rsaPTiMI7OSQEReX` (javascript:S7772, `frontend/src/utilities/i18n/CheckTranslations.cjs`): Node-Builtin-Import auf node:fs bzw. node:path geändert.
- `AZ14rsZJTiMI7OSQERd3` (typescript:S6481, `frontend/src/components/Navbar/Navbar.tsx`): Navigation-Context-Wert mit useMemo an location.pathname gebunden.


## Frontend-UI und CSS

# Frontend UI Sonar remediation

39/39 zugewiesene Findings im Code bearbeitet. Keine Suppression und keine Regelabschaltung. SonarCloud Readback nach frischer Analyse steht aus.

## Checks

- Frontend typecheck initial PASS nach allen Codeaenderungen (Host Node 26).
- Node 22.19.0 gezielte Vitest-Ausfuehrung: 3 Dateien, 6 Tests PASS (GenericCard, MultiComboBox, neue DragAndDrop-Interaktionstests).
- Neuer Dropzone-Test prueft Enter/Space oeffnet genau einmal, gueltige/ungueltige Drops sowie deaktivierte Auswahl.
- Abschliessender Node-22-typecheck voruebergehend durch parallele Aenderungen in GatewayProjectDetailPage.tsx fehlgeschlagen (nicht exportiertes ProjectDetailContent); frontend_core Agent informiert. Keine Fehler in UI-Ownership-Dateien.

## Issue-Zuordnung

- AZ18ho8Is0Fbzs2jF4GI (typescript:S6557, frontend/src/components/ui/input.tsx:12): Minus-Praefix mit startsWith statt Zeichenindex pruefen.
- AZ14rsPZTiMI7OSQERbx (typescript:S3358, frontend/src/components/ui/DetailPageLayout.tsx:51): Navigation vor JSX mit if/else aufbauen; Breadcrumb hat weiterhin Vorrang.
- AZ14rsQOTiMI7OSQERby (typescript:S3358, frontend/src/components/ui/GenericCard.tsx:71): Bildinhalt vor JSX bestimmen; eigenes Bild hat weiterhin Vorrang vor URL.
- AZ14rsYdTiMI7OSQERdc (typescript:S3358, frontend/src/components/dnd/SortableList.tsx:120): Achsen-Modifikatoren mit unabhaengigen if-Zweigen bestimmen.
- AZ14rsQXTiMI7OSQERb0 (typescript:S6819, frontend/src/components/ui/dragAndDrop.tsx:109): Native button Dropzone mit nativer Enter/Space Aktivierung, disabled Zustand und separatem verstecktem File-Input; keine verschachtelten Buttons.
- AZ14rsYPTiMI7OSQERdY (typescript:S6479, frontend/src/components/inputs/FileInput.tsx:20): Stabile Objektidentitaet pro File ueber WeakMap/UUID statt Listenindex als React key.
- AZ14rsWGTiMI7OSQERcj (typescript:S3358, frontend/src/components/iconButtons/AddIconButton.tsx:19): Icon und DialogTrigger mit if/else bestimmen; bisherige Disabled/Dialog-Zweige bleiben erhalten.
- AZ14rsYCTiMI7OSQERdV (typescript:S7753, frontend/src/components/inputs/MultiComboBox.tsx:90): indexOf statt findIndex fuer Stringidentitaet.
- AZ14rsRITiMI7OSQERb1 (typescript:S6747, frontend/src/components/ui/command.tsx:39): Wrapper nutzt standardkonformes data-cmdk-input-wrapper; beide zugehoerigen CSS Selektoren angepasst.
- AZ14rsOqTiMI7OSQERbu (typescript:S6481, frontend/src/components/ui/form.tsx:36): FormField- und FormItem-Contextwerte mit useMemo stabilisiert.
- AZ14rsOqTiMI7OSQERbv (typescript:S6481, frontend/src/components/ui/form.tsx:80): FormField- und FormItem-Contextwerte mit useMemo stabilisiert.
- AZ14rsRUTiMI7OSQERb2 (typescript:S3358, frontend/src/components/ui/table.tsx:47): Statuszeile mit if/else vorbereiten; leerer Zustand hat weiterhin Vorrang vor Loading.
- AZ14rsSrTiMI7OSQERb- (typescript:S6478, frontend/src/components/ui/calendar.tsx:77): Beide Icon-Komponenten ausserhalb Calendar auf Modulebene definiert.
- AZ14rsSrTiMI7OSQERb_ (typescript:S6478, frontend/src/components/ui/calendar.tsx:78): Beide Icon-Komponenten ausserhalb Calendar auf Modulebene definiert.
- AZ14rsbBTiMI7OSQERew (css:S125, frontend/src/index.css:38): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERex (css:S125, frontend/src/index.css:39): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERey (css:S125, frontend/src/index.css:40): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERez (css:S125, frontend/src/index.css:41): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe0 (css:S125, frontend/src/index.css:42): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe1 (css:S125, frontend/src/index.css:43): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe2 (css:S125, frontend/src/index.css:44): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe3 (css:S125, frontend/src/index.css:45): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe4 (css:S125, frontend/src/index.css:46): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe5 (css:S125, frontend/src/index.css:47): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe6 (css:S125, frontend/src/index.css:48): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe7 (css:S125, frontend/src/index.css:49): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe8 (css:S125, frontend/src/index.css:50): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe9 (css:S125, frontend/src/index.css:51): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe- (css:S125, frontend/src/index.css:52): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERe_ (css:S125, frontend/src/index.css:53): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERfA (css:S125, frontend/src/index.css:54): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERfB (css:S125, frontend/src/index.css:55): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ14rsbBTiMI7OSQERfC (css:S125, frontend/src/index.css:56): Nicht aktive auskommentierte Dark-Theme CSS Definitionen entfernt.
- AZ7wpC_YtqcQ6bfjpsKs (typescript:S4782, frontend/src/components/ui/carousel.tsx:16): Options/Plugin-Aliase NonNullable, memoizierter Context, benannte section fuer Carousel und fieldset fuer Slide-Gruppe mit Reset-Klassen.
- AZ7wpC_YtqcQ6bfjpsKt (typescript:S4782, frontend/src/components/ui/carousel.tsx:17): Options/Plugin-Aliase NonNullable, memoizierter Context, benannte section fuer Carousel und fieldset fuer Slide-Gruppe mit Reset-Klassen.
- AZ14rsRnTiMI7OSQERb4 (typescript:S6481, frontend/src/components/ui/carousel.tsx:123): Options/Plugin-Aliase NonNullable, memoizierter Context, benannte section fuer Carousel und fieldset fuer Slide-Gruppe mit Reset-Klassen.
- AZ14rsRnTiMI7OSQERb5 (typescript:S6819, frontend/src/components/ui/carousel.tsx:135): Options/Plugin-Aliase NonNullable, memoizierter Context, benannte section fuer Carousel und fieldset fuer Slide-Gruppe mit Reset-Klassen.
- AZ14rsRnTiMI7OSQERb6 (typescript:S6819, frontend/src/components/ui/carousel.tsx:180): Options/Plugin-Aliase NonNullable, memoizierter Context, benannte section fuer Carousel und fieldset fuer Slide-Gruppe mit Reset-Klassen.
- AZ14rsRxTiMI7OSQERb7 (typescript:S6819, frontend/src/components/ui/pagination.tsx:13): Native nav statt div role=navigation; Props-Typ entsprechend angepasst.
