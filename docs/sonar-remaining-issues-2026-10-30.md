# Verbleibende SonarCloud-Issues vom 30.10.2026

Ausgangsbasis: `origin/dev` bei `452266f` nach PR #67. Der vollständig geladene SonarCloud-Snapshot für OPEN/CONFIRMED auf `dev` enthält 90 Issues: 89 mit höchstem Impact LOW und 1 INFO. Alle 90 Issue-Keys sind in den Einzelberichten unten zugeordnet.

Die Änderungen liegen auf `fix/sonar-remaining-issues`. Drei Subagenten haben getrennte Dateibereiche bearbeitet. Es wurden keine Regeln deaktiviert, Findings unterdrückt oder Coverage-Ausnahmen ergänzt. SonarCloud muss die endgültige Auflösung auf `dev` nach Merge und neuer Analyse bestätigen.

## Verhalten und Grenzen

- Retry-Aufrufe bleiben sequenziell mit unabhängigem Timeout pro Versuch und linearem Backoff; Tests prüfen den Ablauf und den Abbruch zeitüberschrittener Aufrufe.
- Bestehende Booking-URLs, Zeitvalidierung und Unicode-basierte Farbcodes bleiben erhalten.
- Footer-HTML wird mit der vorhandenen sanitize-html-Abhängigkeit bereinigt. Bilder, Links und erlaubte Inline-Textformatierung bleiben erhalten; ausführbare Inhalte und nicht erlaubte CSS-Eigenschaften werden entfernt.
- GenericCard rendert ReactNodes unverändert und interpretiert nur String-Beschreibungen im HTML-Modus als HTML.
- Die eingebettete Karte erhält einen aussagekräftigen zugänglichen Titel. Weitere Korrekturen betreffen readonly Props, Typen, Imports und vereinfachte Ausdrücke.

## Gemeinsame lokale Validierung

Unter Node 22.19.0 erfolgreich:

- Vollständiger `CI_SONAR=true npm run test:coverage`: 365 Tests (Shared 12, Gateway 146, Frontend 206, PostgREST-Smoke 1).
- Gateway-ESLint und Typecheck/Build sowie Frontend-Typecheck.
- Gateway-Vertragsprüfung, Frontend-Build im Gateway-Modus und Prerender-Prüfung mit temporärem lokalen Mock-Gateway. Keine produktive Inhaltsabnahme.
- Ergänzender lokaler Scan der betroffenen Dateien mit acht verfügbaren SonarJS-Regeln plus React-/Promise-/Iframe-Prüfungen ohne Findings.
- Vollständige Zuordnung aller 90 Issue-Keys und `git diff --check`.

## Nachbesserung nach dem ersten PR-Scan

Der erste Scan von PR #68 bestand das Quality Gate, meldete jedoch zwei zusätzliche Low-Findings: `S1940` am negierten Retry-Grenzvergleich und `S6759` an der neu benannten PriceCard. Beide wurden im Code korrigiert. Die Retry-Grenzprüfung behält das Verhalten für negative Werte und NaN bei; zwei zusätzliche Tests prüfen, dass dabei kein Request startet. PriceCard-Props sind nun readonly.

## Einzelberichte

# Remaining foundations remediation

All 21 assigned findings addressed in source without suppression, rule changes or exclusions. Also fixed newly surfaced S6594 by using regex.test for the boolean whitespace predicate.

Validation with Node v22.19.0:
- Actual content-gateway ESLint: PASS.
- content-gateway typecheck: PASS.
- Complete content-gateway tests: PASS, 23 files / 146 tests.
- Frontend typecheck: PASS.
- Frontend foundation-utils + core-utils: PASS, 2 files / 11 tests.
- Scoped git diff --check: PASS.

Added retry fake-timer tests for exact linear backoff, per-attempt abort signals, timer cleanup, timeout abort and recovery. Added frontend compatibility cases for ASCII/umlaut/emoji/lone-surrogate color hashes, time-pattern acceptance boundaries, nullable whitespace and repeated sharp-s normalization.

No commits or pushes. A new SonarCloud analysis is required to confirm server-side resolution.

| Issue | Rule | Resolution |
| --- | --- | --- |
| AZ51cXqWGzJsVDTR0zOf | S6582 | Optional latitude access rejects absent/null coordinates while retaining valid zero coordinates. |
| AZ14rsbpTiMI7OSQERfO | S7778 | Merged consecutive metric-line pushes; emitted order and text unchanged. |
| AZ14rsbpTiMI7OSQERfP | S7778 | Merged consecutive metric-line pushes; emitted order and text unchanged. |
| AZ14rsbpTiMI7OSQERfQ | S7778 | Merged consecutive metric-line pushes; emitted order and text unchanged. |
| AaGH5SL2S2GXTwzn7aHr | S9382 | Separated timed single request from sequential bounded retry recursion; each timer clears before linear backoff and next attempt. Preserved error classification, retry count and no concurrent fetches. |
| AaGH5SL2S2GXTwzn7aHs | S9382 | Separated timed single request from sequential bounded retry recursion; each timer clears before linear backoff and next attempt. Preserved error classification, retry count and no concurrent fetches. |
| AZ14rsaCTiMI7OSQEReL | S6759 | TranslatedText/TranslatedHtml inline prop types wrapped in Readonly. |
| AZ14rsaCTiMI7OSQEReM | S6759 | TranslatedText/TranslatedHtml inline prop types wrapped in Readonly. |
| AZ14rsayTiMI7OSQEReq | S7781 | Literal sharp-s replacement uses replaceAll. |
| AZ14rsaeTiMI7OSQERee | S1533 | Whitespace utility accepts primitive string; removed String wrapper type. |
| AZ14rsaeTiMI7OSQERef | S6571 | Nullability predicate accepts unknown instead of any union. |
| AZ14rsaITiMI7OSQEReN | S6325 | Static time patterns use regex literals. |
| AZ14rsaITiMI7OSQEReO | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReP | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReQ | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReR | S6325 | Static time patterns use regex literals. |
| AZ14rsaITiMI7OSQEReS | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReT | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReU | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsaITiMI7OSQEReV | S6353 | ASCII digit classes replaced by equivalent \d in time regexes. |
| AZ14rsasTiMI7OSQERel | S7758 | codePointAt on existing single UTF-16-unit strings preserves historical text hashes, including astral characters and lone surrogates. |

# Remaining UI findings

28/28 zugewiesene Findings bearbeitet. Kein Commit/Push, keine Suppression/Regelaenderung. SonarCloud-Aufloesung erst durch neue Analyse nachweisbar.

## Validierung

- Node 22 frontend typecheck: PASS.
- git diff --check: PASS.
- Gezielte Tests GenericCard, Footer, DetailMediaSection, MultiComboBox, quality-behavior: 5 Dateien, 21 Tests PASS.
- ImageCarousel und sonarFixes: 2 Dateien, 10 Tests PASS. Insgesamt 31 gezielte Tests gruen.

## Issue Mapping

- AZ51cXf2GzJsVDTR0zOY (typescript:S6759, frontend/src/components/ui/detailMediaSection.tsx:22): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ51cXf2GzJsVDTR0zOZ (typescript:S6759, frontend/src/components/ui/detailMediaSection.tsx:122): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ51cXf2GzJsVDTR0zOa (typescript:S6759, frontend/src/components/ui/detailMediaSection.tsx:196): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsQOTiMI7OSQERbz (typescript:S6551, frontend/src/components/ui/GenericCard.tsx:117): HTML nur fuer string descriptions setzen; ReactNode unveraendert als ReactNode rendern. Regression prueft ReactElement, HTML-String und literalen String.
- AZ14rsWqTiMI7OSQERcr (typescript:S6767, frontend/src/components/projects/projectDialog.tsx:13): Ungenutztes school aus ProjectDialog-Interface entfernt; keine Repo-Aufrufer des Dialogs gefunden. ProjectCard-Schulkontext war davon unabhaengig.
- AZ14rsZQTiMI7OSQERd4 (typescript:S6759, frontend/src/components/Images/ImageCarousel.tsx:15): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsZQTiMI7OSQERd5 (typescript:S6594, frontend/src/components/Images/ImageCarousel.tsx:97): Gleiche Capture-Gruppe mit RegExp.exec statt String.match auslesen.
- AZ14rsWqTiMI7OSQERcs (typescript:S6759, frontend/src/components/projects/projectDialog.tsx:16): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsYdTiMI7OSQERda (typescript:S6759, frontend/src/components/dnd/SortableList.tsx:35): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsYdTiMI7OSQERdb (typescript:S6759, frontend/src/components/dnd/SortableList.tsx:72): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsYPTiMI7OSQERdX (typescript:S6759, frontend/src/components/inputs/FileInput.tsx:22): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsWxTiMI7OSQERcw (typescript:S6759, frontend/src/components/projects/projectCard.tsx:10): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsWiTiMI7OSQERcn (typescript:S1128, frontend/src/components/filters/dateRangeFilter.tsx:9): Genannten ungenutzten Import entfernt.
- AZ14rsXATiMI7OSQERcy (typescript:S6644, frontend/src/components/confirmationDialog/confirmationDialogContent.tsx:14): Truthiness-basierten Fallback aequivalent mit || ausdruecken.
- AZ14rsWiTiMI7OSQERco (typescript:S7759, frontend/src/components/filters/dateRangeFilter.tsx:53): Aktuellen Zeitstempel mit Date.now() statt neuer Date-Instanz/getTime lesen.
- AZ14rsWiTiMI7OSQERcp (typescript:S7759, frontend/src/components/filters/dateRangeFilter.tsx:65): Aktuellen Zeitstempel mit Date.now() statt neuer Date-Instanz/getTime lesen.
- AZ14rsWbTiMI7OSQERcm (typescript:S6759, frontend/src/components/filters/searchFilter.tsx:12): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsX7TiMI7OSQERdR (typescript:S1135, frontend/src/components/layout/Footer.tsx:77): Offene Anforderung implementiert: Footer-HTML mit vorhandener sanitize-html Dependency bereinigt, Default-Tags/Links plus Bilder und sichere Inline-Farben/Textformate erlaubt. Gateway hat keine vorherige Sanitization; deshalb keine blosse Kommentarentfernung. Regression bestaetigt Farben, Bilder, Links und entfernt Events, JavaScript-URLs, Skripte, nicht erlaubte Styles.
- AZ14rsX7TiMI7OSQERdS (typescript:S6759, frontend/src/components/layout/Footer.tsx:78): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsW4TiMI7OSQERcx (typescript:S6759, frontend/src/components/projects/pageHeader.link.tsx:9): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsWqTiMI7OSQERcq (typescript:S1128, frontend/src/components/projects/projectDialog.tsx:1): Genannten ungenutzten Import entfernt.
- AZ14rsYWTiMI7OSQERdZ (typescript:S6759, frontend/src/components/icons/ServicePortalIcon.tsx:4): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsY4TiMI7OSQERdm (typescript:S1128, frontend/src/components/DataDisplay/PaginationContainer.tsx:8): Genannten ungenutzten Import entfernt.
- AZ14rsYJTiMI7OSQERdW (typescript:S6759, frontend/src/components/inputs/DateRangePicker.tsx:22): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.
- AZ14rsYCTiMI7OSQERdU (typescript:S7765, frontend/src/components/inputs/MultiComboBox.tsx:76): Existenz mit includes statt indexOf === -1 pruefen.
- AZ14rsY4TiMI7OSQERdk (typescript:S1128, frontend/src/components/DataDisplay/PaginationContainer.tsx:3): Genannten ungenutzten Import entfernt.
- AZ14rsY4TiMI7OSQERdl (typescript:S1128, frontend/src/components/DataDisplay/PaginationContainer.tsx:3): Genannten ungenutzten Import entfernt.
- AZ14rsReTiMI7OSQERb3 (typescript:S6759, frontend/src/components/ui/skeleton.tsx:3): Component-Props lokal mit Readonly<T> versehen; keine tiefe Datenmodell-Aenderung.

# Remaining Frontend Core: 41 Issues

Alle 41 zugewiesenen Findings im Code bearbeitet. Keine Suppressionen oder Regeländerungen. Remote-Auflösung bleibt an frischen SonarCloud-Scan gebunden.

## Checks

- Node 22.19.0.
- Frontend typecheck: Exit 0.
- 16 gezielte Testdateien: 51 Tests bestanden.
- Neue relevante Tests: wiederholte Umlaute/ß in Booking-URLs; aussagekräftiger zugänglicher iframe-Titel mit korrekter Embed-URL.
- git diff --check: sauber.
- Kein Commit oder Push.

## Issue-Key / Lösung

- `AaDm3vvnY9Y8_M4Of080` (typescript:S7781, `frontend/src/components/booking/bookingPath.ts`): Globale Ein-Zeichen-Ersetzungen auf replaceAll mit String-Literal umgestellt; wiederholte Umlaute und ß durch Verhaltenstest abgesichert.
- `AaDm3vvnY9Y8_M4Of081` (typescript:S7781, `frontend/src/components/booking/bookingPath.ts`): Globale Ein-Zeichen-Ersetzungen auf replaceAll mit String-Literal umgestellt; wiederholte Umlaute und ß durch Verhaltenstest abgesichert.
- `AaDm3vvnY9Y8_M4Of082` (typescript:S7781, `frontend/src/components/booking/bookingPath.ts`): Globale Ein-Zeichen-Ersetzungen auf replaceAll mit String-Literal umgestellt; wiederholte Umlaute und ß durch Verhaltenstest abgesichert.
- `AaDm3vvnY9Y8_M4Of083` (typescript:S7781, `frontend/src/components/booking/bookingPath.ts`): Globale Ein-Zeichen-Ersetzungen auf replaceAll mit String-Literal umgestellt; wiederholte Umlaute und ß durch Verhaltenstest abgesichert.
- `AZ7wpDEWtqcQ6bfjpsKw` (typescript:S7755, `frontend/src/components/events/eventPageUtils.ts`): Letztes Element über .at(-1) nach bestehendem Nonempty-Guard gelesen.
- `AZ7wpDEWtqcQ6bfjpsKx` (typescript:S6594, `frontend/src/components/events/eventPageUtils.ts`): Datumsregex über RegExp.exec ausgewertet; bestehende Datums-/Eventtests bestanden.
- `AZ51cXjWGzJsVDTR0zOb` (typescript:S7744, `frontend/src/components/events/eventCard.tsx`): Unerforderlichen leeren Fallback beim Object-Spread entfernt; EventCard Navigationstest bestanden.
- `AZ7wpDGVtqcQ6bfjpsK2` (typescript:S5906, `frontend/src/components/Navbar/Navbar.test.tsx`): Längenprüfung auf toHaveLength spezialisiert.
- `AZ2SSywjeeqV-oX7yb2j` (typescript:S1128, `frontend/src/components/booking/BookingErrorState.tsx`): Ungenutzten Import entfernt; vorhandenen Re-Export erhalten, wo vorhanden.
- `AZ2SSy6MeeqV-oX7yb2q` (typescript:S4323, `frontend/src/booking-api/client.ts`): Wiederholte Suchparameter-Union in BookingSearchParameter-Typalias benannt.
- `AZ2SSyy2eeqV-oX7yb2m` (typescript:S6759, `frontend/src/components/booking/BookingAvailability.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ2SSyxjeeqV-oX7yb2k` (typescript:S7726, `frontend/src/components/booking/priceCard.tsx`): Default-Export-Funktion mit aussagekräftigem Komponentennamen versehen.
- `AZ18hpC7s0Fbzs2jF4GT` (typescript:S6571, `frontend/src/builder/BuilderPreviewContent.tsx`): Builder-State aus dem tatsächlichen BuilderComponent-content-Vertrag abgeleitet; useErrorToast-Eingang ist explizit unknown statt redundantem Union.
- `AZ18hpC7s0Fbzs2jF4GW` (typescript:S6759, `frontend/src/builder/BuilderPreviewContent.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ2SSyvneeqV-oX7yb2i` (typescript:S1128, `frontend/src/components/booking/bookingIntegration.tsx`): Ungenutzten Import entfernt; vorhandenen Re-Export erhalten, wo vorhanden.
- `AZ18hpBUs0Fbzs2jF4GO` (typescript:S6582, `frontend/src/routes/booking/index.lazy.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ18hpA3s0Fbzs2jF4GK` (typescript:S6759, `frontend/src/routes/events/$eventId.lazy.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ18hpAns0Fbzs2jF4GJ` (typescript:S6759, `frontend/src/routes/projects/$projectId.lazy.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ18hpBEs0Fbzs2jF4GL` (typescript:S6759, `frontend/src/routes/builder-preview.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsbITiMI7OSQERfD` (typescript:S6759, `frontend/src/builder/registry.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsbITiMI7OSQERfE` (typescript:S6759, `frontend/src/builder/registry.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsUfTiMI7OSQERcR` (typescript:S6759, `frontend/src/components/booking/bookingCard.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsV1TiMI7OSQERcf` (typescript:S6759, `frontend/src/components/events/eventCard.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsXYTiMI7OSQERdD` (typescript:S1128, `frontend/src/components/public-content/ProjectsMarketplacePage.tsx`): Ungenutzten Import entfernt; vorhandenen Re-Export erhalten, wo vorhanden.
- `AZ14rsXfTiMI7OSQERdF` (typescript:S1128, `frontend/src/components/public-content/ProjectsSchoolsPage.tsx`): Ungenutzten Import entfernt; vorhandenen Re-Export erhalten, wo vorhanden.
- `AZ14rsZuTiMI7OSQEReH` (typescript:S3863, `frontend/src/routes/projects.lazy.tsx`): Mehrfachimporte aus gleichem Modul zusammengeführt.
- `AZ14rsa6TiMI7OSQERev` (typescript:S6571, `frontend/src/hooks/useErrorToast.ts`): Builder-State aus dem tatsächlichen BuilderComponent-content-Vertrag abgeleitet; useErrorToast-Eingang ist explizit unknown statt redundantem Union.
- `AZ14rsXITiMI7OSQERc8` (typescript:S6582, `frontend/src/components/public-content/GatewayEventsPage.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ14rsXuTiMI7OSQERdM` (typescript:S1090, `frontend/src/components/public-content/GatewayMapPage.tsx`): iframe-Titel Interaktive Karte: <Seitentitel> ergänzt, mit eigenem Accessibility-/URL-Test geprüft.
- `AZ14rsVETiMI7OSQERcb` (typescript:S6582, `frontend/src/components/events/eventIntegration.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ14rsbPTiMI7OSQERfK` (typescript:S7759, `frontend/src/main.tsx`): Zeitstempel direkt per Date.now erzeugt.
- `AZ14rsV1TiMI7OSQERce` (typescript:S1128, `frontend/src/components/events/eventCard.tsx`): Ungenutzten Import entfernt; vorhandenen Re-Export erhalten, wo vorhanden.
- `AZ14rsU8TiMI7OSQERcU` (typescript:S6582, `frontend/src/components/booking/priceCard.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ14rsVETiMI7OSQERcY` (typescript:S6582, `frontend/src/components/events/eventIntegration.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ14rsVETiMI7OSQERcZ` (typescript:S6582, `frontend/src/components/events/eventIntegration.tsx`): Bestehende Null-/Undefined-Guards auf Optional Chaining reduziert; Verhalten durch relevante Integrationstests geprüft.
- `AZ14rsV9TiMI7OSQERci` (typescript:S6759, `frontend/src/components/events/sortFilter.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsUXTiMI7OSQERcQ` (typescript:S6759, `frontend/src/components/booking/bookingDivider.tsx`): Komponentenparameter mit Readonly<Props> markiert, bestehende Daten-/Callback-Verträge erhalten.
- `AZ14rsUPTiMI7OSQERcM` (typescript:S3863, `frontend/src/components/booking/bookingHowItWorks.tsx`): Mehrfachimporte aus gleichem Modul zusammengeführt.
- `AZ14rsUPTiMI7OSQERcN` (typescript:S3863, `frontend/src/components/booking/bookingHowItWorks.tsx`): Mehrfachimporte aus gleichem Modul zusammengeführt.
- `AZ14rsUPTiMI7OSQERcO` (typescript:S7726, `frontend/src/components/booking/bookingHowItWorks.tsx`): Default-Export-Funktion mit aussagekräftigem Komponentennamen versehen.
- `AZ14rsZuTiMI7OSQEReG` (typescript:S3863, `frontend/src/routes/projects.lazy.tsx`): Mehrfachimporte aus gleichem Modul zusammengeführt.
