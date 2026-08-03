## Why

Die Startseiten-Kacheln werden derzeit aus der lokalen Content-Datenbank geladen und koennen deshalb nicht ueber den zentralen Smart-Village-Redaktionsprozess gepflegt werden. Die bestehende lokale Dashboard-Struktur soll erhalten bleiben, waehrend `COCKPIT_CARD` Generic Items aus dem Smart Village Mainserver die bevorzugte Kachelquelle werden und die lokalen Kacheln als belastbarer Rueckfall bestehen bleiben.

## What Changes

- Abfrage der Smart-Village-Generic-Items vom Typ `COCKPIT_CARD` ueber die bestehende serverseitige OAuth-/GraphQL-Anbindung.
- Sprachabhaengige Normalisierung von Titel, Beschreibung, Bild, Link, Buttontext, Sortierung und Linkverhalten in den bestehenden `InformationCard`-Vertrag.
- Zuordnung der Mainserver-Kacheln ausschliesslich ueber `categories.name` zu den lokalisierten Titeln der bestehenden Dashboard-Tabs.
- Beibehaltung der lokalen Dashboard-JSON-Struktur fuer Dropdowns, Tabs, Reihenfolge, Kartenansicht und Karten-/Map-Layout.
- Automatische Anzeige neuer Kacheln in bereits bekannten Kategorien ohne Aenderung der lokalen Struktur.
- Ignorieren und Diagnostizieren unbekannter Kategorien, bis die lokale Dashboard-Struktur um einen entsprechenden Tab erweitert wird.
- Beibehaltung der lokalen Datenbank-Kacheln als Backup, wenn der Smart Village Upstream fehlschlaegt oder keine nutzbaren Kacheln fuer die angeforderte Sprache liefert.

## Capabilities

### New Capabilities

- `smart-village-cockpit-card-integration`: Serverseitiges Laden, Validieren, Filtern, Sortieren und kategoriebezogenes Einsetzen von `COCKPIT_CARD` Generic Items in die lokale Dashboard-Struktur einschliesslich lokalem Backup.

### Modified Capabilities

Keine.

## Impact

- `content-gateway`: neues Smart-Village-Repository fuer Cockpit Cards sowie hybride Komposition mit der bestehenden PostgREST-Dashboard-Struktur.
- `shared/public-content`: der bestehende `InformationCard`- und Dashboard-Vertrag bleibt nach aussen stabil.
- `frontend`: keine neue Datenquelle und keine direkte Mainserver-Authentifizierung; bestehende Home- und Dashboard-Ansichten konsumieren weiterhin die Gateway-Vertraege.
- Betrieb: keine neuen Secrets oder Dienste; die vorhandene Smart-Village-OAuth-/GraphQL-Konfiguration wird wiederverwendet.
