## Context

Die Route `/projects` zeigt heute die einleitenden Projektinhalte, einen Slider mit Featured Projects und darunter zwei lokale Navigationskacheln fuer "Schulen" und "Marktplatz". Diese Kacheln fuehren zu getrennten Listen, obwohl beide Listen aus demselben lokalen PostgREST-Projektmodell stammen und nur durch `type === 2` beziehungsweise `type === 0` unterschieden werden. Auch die gemeinsame Detailroute `/projects/:projectId` versucht bisher, Featured Projects, Schulen und Unternehmen aus paginierten Projektdaten zu finden.

Kuenftig sind Schulen und Unternehmen keine getrennten Projektarten mehr, sondern Points of Interest im Smart Village Mainserver. Sie stehen dort gemeinsam mit weiteren POI-Kategorien. Das live eingelesene GraphQL-Schema bietet `pointsOfInterest` mit `search`, `categoryId`/`categoryIds`, `location`, `order`, `limit` und `skip` sowie `pointOfInterest(id: ID!)`. POIs enthalten unter anderem Status, Kategorien, Adressen mit Geokoordinaten, Kontakt, Oeffnungszeiten, Medien, Weblinks, Betreiber, Beschreibung und freies `payload`. Die bestehende serverseitige OAuth-/GraphQL-Verbindung des Content Gateways wird bereits fuer Events, FAQs und Cockpit Cards verwendet.

Featured Projects bleiben lokale Projekte und behalten ihren Slider. Die beiden Navigationskacheln und die getrennten School-/Marketplace-Ergebnisansichten werden durch eine gemeinsame POI-Liste direkt auf `/projects` ersetzt. Die GraphQL-Liste liefert keinen separaten `totalCount`; ein Radiusargument fehlt ebenfalls. Der Gateway-Vertrag muss dennoch stabile Facetten, Gesamtzahlen und Seiten liefern.

## Goals / Non-Goals

**Goals:**

- Featured Projects und den bestehenden Slider auf `/projects` unveraendert erhalten.
- Alle oeffentlichen Smart Village POIs gemeinsam unterhalb des Sliders anzeigen.
- Die bisherigen Kacheln "Schulen" und "Marktplatz" entfernen.
- Direkt unter dem Slider eine rote Filterleiste und darunter die paginierte POI-Liste anzeigen.
- Schulen, Unternehmen und weitere fachliche Gruppen ausschliesslich ueber POI-Kategorien filterbar machen.
- Suche, Mehrfach-Kategorien, Radius, Standort und Sortierung mit stabiler Pagination bereitstellen.
- Filter in der URL repraesentieren und bei Navigation, Reload und geteilten Links wiederherstellen.
- Bestehende Detailroute und visuelle Grundelemente erhalten und optionale POI-Details datenabhaengig ergaenzen.
- Alte School-/Marketplace-Links kontrolliert in die gemeinsame POI-Ansicht ueberfuehren.

**Non-Goals:**

- Filter "Nur mit Bild".
- Beibehaltung getrennter School- und Business-Read-Modelle oder Ergebnislisten.
- Aenderung der Datenquelle oder Darstellung der Featured Projects.
- Direkter Browserzugriff auf Smart Village.
- Schreiboperationen oder redaktionelle POI-Verwaltung.
- Generische Anzeige des rohen `payload`.
- Berechneter Echtzeitstatus "jetzt geoeffnet" aus heterogenen Oeffnungszeiten.
- Stiller Rueckfall auf lokale Schulen oder Unternehmen bei Mainserver-Ausfall.

## Decisions

### `/projects` wird zur kombinierten Featured-Project- und POI-Seite

Die bestehende Seite behaelt Breadcrumb, Einleitung und Featured-Project-Slider. `CategoryTiles` und die beiden nachgelagerten Listenkomponenten werden aus dem aktiven Seitenfluss entfernt. Nach dem Slider folgt in dieser Reihenfolge:

1. die rote POI-Filterleiste;
2. die Ergebnisanzahl und Pagination;
3. das bestehende responsive Kartenraster mit POIs.

Featured Projects und POIs werden durch getrennte Gateway-Abfragen geladen. Dadurch muss eine POI-Filteraenderung den Slider nicht neu laden und ein POI-Fehler kann mit einem eigenen Fehlerzustand unterhalb eines bereits geladenen Sliders erscheinen. Ein gemeinsamer grosser `/api/content/projects`-Payload wurde verworfen, weil er lokale Projekte und externe POIs erneut unnoetig koppeln wuerde.

### Schulen und Unternehmen sind Kategorien, keine Seitentypen

Der oeffentliche POI-Vertrag kennt keine `school`-/`business`-Discriminator-Felder. Jede POI-Kategorie wird anhand ihrer stabilen GraphQL-Kategorie-ID als Filteroption angeboten; Kategorienamen dienen nur der Anzeige. Mehrere Kategorien koennen gleichzeitig mit ODER-Semantik gewaehlt werden. Damit koennen "Schulen", "Unternehmen" und weitere produktiv vorhandene Kategorien gleichberechtigt gefiltert werden.

Eine fest codierte Beschraenkung auf Schulen und Unternehmen wurde verworfen, weil der neue Seitenaufbau ausdruecklich alle POIs und kuenftige Kategorien aufnehmen soll.

### Eigene POI-Endpunkte und stabiler Featured-Project-Vertrag

Das Gateway behaelt einen schmalen lokalen Read-Pfad fuer Seitenmetadaten und Featured Projects. Fuer die gemeinsame Liste kommt `GET /api/content/pois` mit validierten Filter-/Pagingparametern hinzu; Details werden ueber `GET /api/content/pois/:id` geladen. Die bestehende Browserroute `/projects/:projectId` bleibt sichtbar und verwendet einen typisierten POI-Identifier, um eindeutig zwischen Featured Project und POI zu unterscheiden.

Die alten Routen `/projects/schools` und `/projects/marketplace` rendern keine separaten Listen mehr. Sie leiten nach `/projects` weiter. Wenn die read-only verifizierten produktiven Kategorien eine eindeutige stabile School- beziehungsweise Business-Zuordnung erlauben, wird der entsprechende Kategorienfilter in die Ziel-URL uebernommen. Ohne eindeutige Zuordnung erfolgt eine sichere Weiterleitung auf die ungefilterte POI-Liste statt einer geratenen Klassifikation.

### Schmalen oeffentlichen POI-Vertrag statt GraphQL-Modell durchreichen

Das POI-Repository fragt nur die fuer Liste, Filter und Detail benoetigten Felder ab und mappt sie in einen expliziten Vertrag:

- ID, Name, Kurz-/Langbeschreibung und Sichtbarkeitsstatus;
- Kategorien;
- primaeres Bild fuer die Karte und deduplizierte Medien fuer Details;
- primaere Anschrift und Geokoordinaten;
- Kontakt mit Telefon, E-Mail und Fax;
- Weblinks;
- Oeffnungszeiten;
- optional Betreiber und Datenanbieter, soweit nutzerrelevant.

Nur ID und ein nichtleerer Name sind fuer ein Listenelement zwingend. Inaktive oder nicht sichtbare POIs werden nicht oeffentlich ausgegeben. Leere optionale Gruppen werden ausgelassen. HTML-Beschreibungen werden vor dem Rendern bereinigt. Rohes `payload` bleibt serverintern.

### Smart Village ist fuer POIs autoritativ

Smart Village ist nach der Umstellung die einzige Quelle fuer Schulen, Unternehmen und weitere POIs. Ein Transportfehler oder eine strukturell ungueltige Antwort erzeugt den bestehenden Gateway-Upstream-Fehler. Einzelne POIs mit fehlender ID, fehlendem Namen oder ungueltigen verschachtelten Daten werden mit sicherem Kontext diagnostiziert und isoliert.

Ein Rueckfall auf lokale School-/Business-Projekte wurde verworfen, weil er veraltete oder bereits entfernte Eintraege wieder sichtbar machen koennte. Die lokalen Zeilen werden waehrend der Einfuehrung nicht destruktiv geloescht und bleiben fuer einen Code-Rollback erhalten.

### Eine normalisierte Ergebnismenge fuer Facetten, Filter und Pagination

Das Gateway laedt die fuer den Mandanten lesbaren POIs, normalisiert sie und bildet daraus eine konsistente Ergebnismenge. Statuspruefung und Isolation ungueltiger Datensaetze erfolgen vor allen Benutzerfiltern. Kategorie- und Standortoptionen werden aus der ungefilterten gueltigen Menge gebildet, damit eine aktive Auswahl die uebrigen Optionen nicht verschwinden laesst.

Danach werden angewendet:

1. Freitextsuche ohne Beachtung der Gross-/Kleinschreibung ueber Name und Beschreibung;
2. Mehrfach-Kategorien mit ODER-Semantik;
3. Standort anhand eines stabilen normalisierten Werts aus Anschrift beziehungsweise `location`;
4. Radius um die bestehenden Guben-Koordinaten;
5. deterministische Sortierung;
6. Pagination und `totalCount`/`pageCount`.

Bei aktivem Radius werden POIs ohne gueltige Geokoordinaten ausgeschlossen; ohne Radius bleiben sie sichtbar. GraphQL-Filterargumente koennen spaeter optimierend genutzt werden, duerfen aber Facetten, Gesamtzahlen oder Ergebnismenge nicht veraendern. Reine Upstream-`limit`/`skip`-Pagination wurde verworfen, weil das Schema keinen Gesamtzaehler liefert und der Gateway-Radiusfilter sonst falsche Seiten erzeugt.

### Rote Filterleiste mit validiertem URL-Zustand

Die Filter liegen gemeinsam in einer roten, zum bestehenden Guben-Design passenden Leiste direkt unterhalb des Sliders. Suche, Mehrfach-Kategorien, Radius und Standort stehen wie bei den Veranstaltungen in einer gemeinsamen Fuenfer-Grid-Zeile; der Standort nimmt dabei den Platz des Veranstaltungsdatums ein. Die Sortierung schliesst kompakt in derselben Zeile an und verwendet wie bei Veranstaltungen einen Icon-Button mit einem Dropdown fuer Sortierfeld und Richtung statt dauerhafter Select-Felder. Der POI-Trigger erhaelt auf dem roten Hintergrund eine transparente, weiss umrandete Variante mit weissem Icon; der neutrale Trigger der Veranstaltungsseite bleibt unveraendert. Einen separaten Zuruecksetzen- oder Bildfilter gibt es nicht.

Suche, Kategorie-IDs, Radius, Standort, Sortierfeld, Sortierrichtung, Seite und Seitengroesse werden als validierte TanStack-Router-Suchparameter abgebildet. Filteraenderungen setzen Seite 1; ungueltige Werte fallen auf sichere Standards zurueck. Suche wird entprellt. Frontend und Gateway teilen sich Sortierwerte und -richtungen, damit der bei Veranstaltungen vorhandene `descending`/`desc`-Unterschied nicht wiederholt wird. Standard ist Name aufsteigend; gleiche Werte werden anhand der POI-ID stabil aufgeloest.

### Karten bleiben ruhig, Details werden datenabhaengig reicher

Das bestehende Kartenraster und die `GenericCard`-Grunddarstellung bleiben erhalten: primaeres Bild, sofern vorhanden, und POI-Name. Die Liste zeigt keine dichten Kontakt- oder Oeffnungszeitinformationen.

Die gemeinsame Detailseite unterscheidet nicht mehr zwischen School und Business. Fuer jeden POI rendert sie nur vorhandene Abschnitte: Beschreibung und Medien, Anschrift, Kontakt/Weblinks, Oeffnungszeiten und Kategorien. Telefonnummern, E-Mail-Adressen und Weblinks werden verlinkt. Featured-Project-Details bleiben auf ihrem bestehenden lokalen Pfad und Layout.

## Risks / Trade-offs

- [Die vollstaendige POI-Menge wird fuer konsistente Facetten und Gesamtzahlen geladen] -> Repository-Cache verwenden, Query schmal halten, Volumen messen und eine spaetere Count-/Facet-API getrennt optimieren.
- [Produktive Kategorien koennen uneinheitlich oder hierarchisch sein] -> Kategorien read-only vermessen, IDs statt Namen verwenden und Eltern-/Kinddarstellung vor Implementierung festlegen.
- [Alt-Routen lassen sich eventuell nicht eindeutig auf eine Kategorie abbilden] -> Nur verifizierte stabile Zuordnungen vorbelegen; ansonsten auf die ungefilterte gemeinsame Liste weiterleiten.
- [Standort- und Adressdaten sind redaktionell uneinheitlich] -> Werte normalisieren, leere Optionen entfernen und unbekannte Standorte nicht erfinden.
- [Optionale POI-Felder koennen fehlerhaft oder ueberfuellt sein] -> Feldweise validieren, Listen deduplizieren und nur vereinbarte Felder rendern.
- [Gemeinsame Projektdetailroute kann ID-Kollisionen enthalten] -> POI-Identifier typisieren/praefigieren und eindeutig dekodieren.
- [Mainserver-Ausfall betrifft den POI-Teil der Hauptseite] -> Featured Slider unabhaengig weiter rendern und fuer den POI-Abschnitt einen sichtbaren Retry-Fehlerzustand verwenden.

## Migration Plan

1. Produktive POIs read-only hinsichtlich Anzahl, Status, Kategorien/Hierarchie, Standorten, IDs/Alt-IDs und optionalen Detailfeldern vermessen; School-/Business-Altfilter nur bei eindeutiger Zuordnung festlegen.
2. Shared POI-Vertraege, Filtertypen und GraphQL-Repository mit Mapper-, Fehlerisolations- und Cachetests implementieren.
3. Dedizierte POI-Listen-/Detailendpunkte einfuehren und den Featured-Project-Pfad von lokalen School-/Business-Projektionen trennen.
4. `/projects` auf Einleitung/Slider plus rote Filterleiste plus POI-Liste umbauen; Kategorie-Kacheln entfernen.
5. Separate School-/Marketplace-Listen durch kompatible Weiterleitungen ersetzen und Detaildispatch fuer POIs ergaenzen.
6. Optionale POI-Detailabschnitte ergaenzen und externe Inhalte/Links sicher behandeln.
7. Contract-, Gateway-, Routing-, Frontend-, Accessibility-, Type- und Produktionsbuild-Pruefungen ausfuehren.
8. Nach Deployment Slider, alle POIs/Kategorien, Filterkombinationen, Pagination, Alt-Routen, Details und Teilfehlerverhalten live pruefen.

Rollback stellt den bisherigen `/projects`-Aufbau mit Kategorie-Kacheln und lokalen School-/Business-Listen wieder her. Lokale Daten werden bis nach erfolgreicher produktiver Verifikation nicht geloescht. Destruktives Cleanup ist nicht Bestandteil dieses Changes.

## Open Questions

Keine fuer die Implementierung. Der read-only Live-Check vom 2026-08-04 hat festgelegt:

- Kategorien werden flach und ID-basiert angezeigt; die beobachteten Alt-Routen verwenden `6186` (`Schulen`) und `6187` (`Unternehmen`).
- Der Standort verwendet zuerst `location.name` und danach die erste nichtleere `addresses[].city`.
- Keine der 73 lokalen School-/Business-IDs stimmt mit einer POI-ID oder `externalId` ueberein; unsichere Detail-Aliase werden deshalb nicht eingefuehrt.
