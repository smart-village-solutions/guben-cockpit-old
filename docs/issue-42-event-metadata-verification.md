# Issue #42: Event-Metadaten – Umsetzung und Abnahme

## Technischer Umfang

Die bestehende Eventdarstellung und Galerie werden weiterverwendet. Die Änderung
schließt die Lücken bei Bildbeschreibungen, Bild-URL-Validierung und leeren
Standort-/Kategorieblöcken. Import, Persistenz und Studio-Editor bleiben außerhalb
dieses Repositorys.

| Kriterium | Nachweis im Repository |
| --- | --- |
| Bilder und Reihenfolge | Mapper-Tests für `null`, leere Liste, ein und mehrere Bilder; ungültige URLs werden ausgefiltert, die Reihenfolge gültiger Bilder bleibt erhalten. |
| Bildmetadaten | `sourceUrl.description` bleibt als optionales `images[].description` im öffentlichen Vertrag erhalten; Galerie und Karte nutzen den Text als Alternative, die Galerie zusätzlich als Beschriftung. |
| Galerie | Eventseiten-Tests für null, ein und mehrere Bilder sowie Navigation; bestehende Galerie-Tests für Vollbild und Navigation. |
| Metadaten | Kontrollierter Biletado-Testdatensatz durchläuft den echten Mapper einschließlich Vertrag und wird auf der Eventseite geprüft: Adresse, Kategorie, Ticket-Link, Kontakt, Veranstalter, Preis, Registrierung, Teilnehmerlimit, Quelle. |
| Fehlende optionale Werte | Mapper lässt unbekannte Metadaten weg; UI-Tests prüfen fehlende Teilnahmeinformationen, Standort und Kategorien. |
| Sichere Links | Mapper verwirft ungültige Ticket- und Bild-URLs; vorhandene Kontaktvalidierung bleibt bestehen. |

Der kontrollierte Datensatz `biletado-controlled-42` ist ausschließlich eine
Test-Fixture. Er wurde nicht in ein produktives System geschrieben und stellt
keine produktive Abnahme dar.

## Lokale Validierung

- `npm test` im Repository: 325 Tests erfolgreich (12 Shared, 139 Gateway,
  173 Frontend und ein PostgREST-Smoke-Test).
- Gateway: Typecheck, Lint und Build erfolgreich.
- Frontend: Typecheck und SPA-Build erfolgreich; Prerender und dessen Prüfung
  erfolgreich mit `PRERENDER_CONTENT_GATEWAY_URL=https://cockpit.guben.de`.
  Ohne diesen Parameter fehlt im isolierten Worktree ein lokaler Gateway auf
  Port 5100. Dieser Build-Nachweis ersetzt keine Live-Prüfung der neuen UI.

## Lesende Live-Prüfung vor Auslieferung

Am 30.10.2026 wurden beide Seiten der öffentlichen Eventliste unter
`https://cockpit.guben.de/api/content/events?lang=de&pageNumber=1&pageSize=100`
und `pageNumber=2` gelesen. Ergebnis: 122 Termine; Quellenbezeichnungen
120-mal „Tourismus-Marketing Brandenburg“ und zweimal „Cockpit User“.
„Flohmarkt von A-Z“ war in dieser Liste nicht vorhanden. Mehrere Bilder werden
bei anderen Veranstaltungen bereits öffentlich geliefert. Daraus folgt kein
Nachweis für einen kontrollierten Biletado-Mehrbilddatensatz oder die vollständige
Importkette. Ein direkter Mainserver-Vergleich wurde dabei nicht durchgeführt.

## Noch erforderliche produktive Abnahme nach Auslieferung

Issue #42 bleibt bis zu diesem Nachweis offen:

1. Einen kontrollierten Biletado-Datensatz mit mehreren Bildern auswählen;
   Biletado-ID, Mainserver-ID und öffentliche Termin-ID festhalten.
2. Autorisiert und lesend Biletado-/Mainserver-Daten und öffentliche Detailantwort
   feldweise vergleichen. Insbesondere Bildanzahl, Reihenfolge und Beschreibungen
   sowie Adresse, Kategorien, Ticket-Link, Veranstalter, Kontakte, Preise,
   Registrierungspflicht, Teilnehmerlimit und Quelle prüfen.
3. Die ausgelieferte Detailseite und Karte im Browser prüfen: Bildnavigation,
   Vollbild, Bildbeschriftungen/Alternativtexte und Verhalten bei null/einem Bild.
4. Commit/Release, konkrete IDs, Datum/Uhrzeit mit Zeitzone sowie Vergleichsergebnis
   und Browser-Abnahme am Issue dokumentieren. Erst danach das Issue schließen.

Diese Änderung enthält weder einen Produktions-Rollout noch eine bestätigte
fachliche Abnahme.
