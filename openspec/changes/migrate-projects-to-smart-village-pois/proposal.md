## Why

Die Seite `/projects` trennt heute lokale Inhalte in Featured Projects, Schulen und Unternehmen, obwohl Schulen und Unternehmen kuenftig gemeinsam mit weiteren Kategorien als Points of Interest im Smart Village Mainserver gepflegt werden. Die Seite soll deshalb Featured Projects weiterhin prominent zeigen und darunter einen einheitlichen, filterbaren POI-Katalog aus der zentralen GraphQL-Datenquelle anbieten.

## What Changes

- Featured Projects bleiben auf ihrer bestehenden Datenquelle und werden weiterhin im Slider auf `/projects` angezeigt.
- Schulen und Unternehmen werden nicht mehr als getrennte lokale Projektarten behandelt; beide werden gemeinsam mit allen weiteren oeffentlichen POI-Kategorien aus Smart Village geladen.
- Die beiden bisherigen Kacheln "Schulen" und "Marktplatz" unter dem Featured-Project-Slider entfallen.
- Unter dem Slider erscheint eine rote Filterleiste und danach die paginierte Liste aller POIs.
- Die POI-Liste erhaelt Filter fuer Freitextsuche, Mehrfach-Kategorieauswahl, Radius und Standort sowie eine Sortierung. Schulen, Unternehmen und weitere Kategorien sind normale auswählbare POI-Kategorien. Ein Filter "Nur mit Bild" wird nicht eingefuehrt.
- Die bisherigen Unterseiten `/projects/schools` und `/projects/marketplace` werden auf die einheitliche `/projects`-Ansicht ueberfuehrt; kompatible Altlinks werden auf passende Kategorie-Filter weitergeleitet, sofern die produktiven Kategorien stabil zugeordnet werden koennen.
- POI-Details bleiben unter der bestehenden Projektdetailroute erreichbar, werden aber direkt aus Smart Village geladen und nicht mehr als School-/Business-Projekt unterschieden.
- Die Karten- und Detaildarstellung bleibt moeglichst nah am bestehenden Erscheinungsbild. Vorhandene optionale POI-Angaben wie Anschrift, Kontakt, Weblinks, Oeffnungszeiten, Kategorien und weitere Medien koennen auf der Detailseite ergaenzend erscheinen.
- Filterzustand, Facetten, Gesamtzahl und Pagination werden konsistent aus derselben normalisierten POI-Ergebnismenge abgeleitet.
- Fehlerhafte einzelne POIs werden isoliert und diagnostiziert; ein nicht erreichbarer oder strukturell ungueltiger Mainserver wird als Upstream-Fehler behandelt und nicht durch lokale Schulen oder Unternehmen maskiert.

## Capabilities

### New Capabilities

- `smart-village-project-pois`: Serverseitiges Laden, Validieren und Normalisieren aller oeffentlichen Smart Village Points of Interest fuer die einheitliche POI-Liste und Detailansicht auf den Projektseiten, waehrend Featured Projects unveraendert bleiben.
- `project-poi-filtering`: Rote Filterleiste, Filterung, Sortierung, Pagination und URL-stabiler Filterzustand fuer die gemeinsame POI-Liste einschliesslich Schulen, Unternehmen und weiterer Kategorien.

### Modified Capabilities

Keine.

## Impact

- `content-gateway`: neuer POI-Repository-/Mapper-Pfad, POI-Listen- und Detailendpunkte sowie eine klare Trennung zwischen lokalen Featured Projects und Smart-Village-POIs.
- `shared/public-content`: explizite POI-Listen-, Filtermetadaten- und Detailvertraege; der bestehende Featured-Project-Vertrag bleibt erhalten, lokale `schools`-/`businesses`-Projektionen entfallen aus dem aktiven Seitenvertrag.
- `frontend`: Umbau von `/projects` zu Slider plus roter Filterleiste plus POI-Liste; Entfernung der Kategorie-Kacheln und separaten School-/Marketplace-Listen; Migration der Alt-Routen und gemeinsame POI-Detaildarstellung.
- Smart Village GraphQL: Nutzung von `pointsOfInterest` und `pointOfInterest(id: ID!)` ueber die vorhandene serverseitige OAuth-Konfiguration; keine neuen Secrets oder Browser-Zugriffe.
- Betrieb und Tests: Contract-, Mapper-, Repository-, API-, Routing- und Frontendtests sowie Live-Verifikation aller POI-Kategorien und Filterkombinationen nach Deployment.
