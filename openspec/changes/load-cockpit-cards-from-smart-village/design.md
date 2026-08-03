## Context

Die produktive Startseite erhaelt ihre Dashboard-Struktur derzeit ueber das Content Gateway aus PostgREST. Diese Struktur umfasst Dropdowns, lokalisierte Tabs, Reihenfolgen, Karten-URLs und lokale `informationCards`. Der Browser konsumiert ausschliesslich den stabilen Gateway-Vertrag. Smart Village liefert inzwischen 150 `COCKPIT_CARD` Generic Items fuer `de`, `en` und `pl`; die acht Kategorienamen entsprechen nach Entfernung aeusserer Leerzeichen den lokalisierten produktiven Tab-Titeln.

Die Smart-Village-OAuth-/GraphQL-Verbindung besteht bereits fuer Events und Booking-FAQs. Zugangsdaten duerfen weiterhin nur im Gateway verwendet werden. Der Upstream-Vertrag kann noch angepasst werden, fuer diese Ausbaustufe bleibt `categories.name` jedoch bewusst der einzige Zuordnungsschluessel.

## Goals / Non-Goals

**Goals:**

- Smart Village als bevorzugte Quelle fuer Startseiten-Kacheln verwenden.
- Die lokale Dashboard-Struktur unveraendert als grobe Seitenstruktur weiterverwenden.
- Neue Kacheln einer vorhandenen Kategorie ohne lokale Strukturaenderung anzeigen.
- Lokale Kacheln als Rueckfall bei einem unbrauchbaren oder nicht erreichbaren Mainserver erhalten.
- Den bestehenden oeffentlichen Dashboard- und `InformationCard`-Vertrag stabil halten.

**Non-Goals:**

- Kategorien oder Tabs allein aus Mainserver-Daten erzeugen.
- Direkte Zuordnung ueber `payload.sourceTabId`, `payload.dashboardTabId` oder andere IDs.
- Entfernen der lokalen Kacheltabellen.
- Browser-seitiger Zugriff auf Smart Village oder neue Zugangsdaten.
- Aenderung des bestehenden Kachel-Layouts.

## Decisions

### Struktur lokal laden und nur Kacheln anreichern

Das Gateway laedt zunaechst weiterhin das vollstaendige lokale Dashboard. Bei einer nutzbaren Smart-Village-Antwort ersetzt es ausschliesslich die `informationCards` der Tabs; Dropdowns, Tabs, deren Reihenfolge, Karten-URLs und Links bleiben lokal. Ein vollstaendiger Mainserver-Dashboardvertrag wurde verworfen, weil neue Kategorien bewusst erst nach Anpassung der lokalen Struktur sichtbar werden sollen.

### Kategorienamen sprachabhaengig normalisieren und exakt zuordnen

Das Gateway filtert Generic Items anhand von `payload.languageCode` auf die angeforderte Sprache. `categories[0].name` und der lokalisierte Tab-Titel werden mit `trim()` und einer kleingeschriebenen Vergleichsform normalisiert. Jede Kachel wird nur einem vorhandenen Tab mit identischem normalisiertem Namen zugeordnet. Unbekannte oder mehrdeutige Kategorien werden mit sicherem Kontext diagnostiziert und nicht dargestellt. Eine ID-basierte Zuordnung wurde ausdruecklich verworfen, damit neue Kacheln nur durch ihre redaktionelle Kategorie einsortiert werden.

### Schmalen internen Kachelvertrag verwenden

Das Smart-Village-Repository fragt `id`, `title`, `genericType`, `payload`, `contentBlocks.body`, `mediaContents.sourceUrl.url/description`, `webUrls.url/description` und `categories.name` ab. Es normalisiert daraus Kategorie, Sprache, Sortiergewicht und den bestehenden `InformationCard`-Vertrag:

- `title` ist erforderlich;
- Beschreibung, Bild, Bild-Alternativtext und Button sind optional;
- hoechstens der erste Inhalt, das erste Medium und die erste Web-URL werden verwendet;
- ein Button entsteht nur bei einer nichtleeren URL; seine Beschriftung kommt aus `webUrls[0].description` und faellt auf `Mehr erfahren` zurueck;
- `payload.openInNewTab` faellt auf `false` zurueck;
- ein fehlendes oder ungueltiges `sortWeight` faellt auf `0` zurueck.

Das rohe Generic Item wird nicht an den Browser weitergereicht. Strikte Kardinalitaetsfehler bei optionalen Listen werden nicht zum Totalausfall, damit redaktionelle Einzelprobleme isoliert bleiben.

### Innerhalb eines Tabs deterministisch sortieren

Kacheln werden nach numerischem `sortWeight` aufsteigend und anschliessend nach ihrer ID sortiert. Die beobachteten Mainserver-Daten verwenden `0` als erste Position; die explizite Sortierung verhindert, dass die GraphQL-Reihenfolge Teil des Vertrags wird.

### Rueckfall auf Ebene der gesamten Kachelquelle

Schlaegt die Smart-Village-Abfrage fehl oder ergibt die Kombination aus Sprache, gueltigen Items und vorhandenen Kategorien keine einzige nutzbare Kachel, bleiben alle lokalen `informationCards` unveraendert. Sobald mindestens eine Mainserver-Kachel nutzbar ist, gilt Smart Village fuer die angeforderte Sprache als autoritative Kachelquelle: alle lokalen Tab-Kacheln werden geleert und nur passende Mainserver-Kacheln eingesetzt. Dadurch erscheinen bewusst geleerte Kategorien nicht versehentlich wieder mit veralteten lokalen Daten.

Der Rueckfall wird im hybriden Repository umgesetzt und protokolliert. Das Smart-Village-Repository selbst maskiert Transport- oder Vertragsfehler nicht.

### Alle Dashboard-Ausgaben konsistent anreichern

`getHome`, `getDashboard` und `getPublicContent` verwenden denselben Kompositionshelfer. Damit liefern sowohl die interaktive Startseite als auch das oeffentliche Content-Bundle dieselbe Kachelquelle. Die abgeflachte `home.cards`-Liste wird aus dem bereits angereicherten Dashboard neu gebildet.

## Risks / Trade-offs

- [Redaktionelle Umbenennung einer Kategorie oder eines Tabs trennt die Zuordnung] -> Vergleich normalisieren, unbekannte Kategorien protokollieren und die benoetigte exakte Namensgleichheit dokumentieren.
- [Eine teilweise befuellte Mainserver-Sprache leert andere bekannte Tabs] -> Smart Village ist nach dem erfolgreichen Cutover autoritativ; der lokale Rueckfall greift nur, wenn insgesamt keine nutzbare Kachel vorliegt.
- [Einzelne Generic Items sind unvollstaendig] -> Optionale Inhalte tolerant normalisieren und nur Items ohne erforderliche Identitaet, Sprache, Kategorie oder Titel ueberspringen.
- [Drei Dashboard-Endpunkte koennten auseinanderlaufen] -> Einen gemeinsamen, rein funktionalen Kompositionspfad verwenden und alle drei Pfade testen.
- [Der Kategoriename ist absichtlich fehleranfaelliger als ein stabiler Schluessel] -> Diese bekannte Einschraenkung akzeptieren und einen spaeteren Wechsel auf einen stabilen Kategorie-Key getrennt planen.

## Migration Plan

1. Internen Smart-Village-Cockpit-Card-Vertrag, Query, Mapping und Tests ergaenzen.
2. Hybride Dashboard-Komposition und Rueckfalltests implementieren.
3. Repository-Wiring fuer den bestehenden PostgREST-Modus ergaenzen.
4. Gateway- und Contract-Tests sowie den Produktions-Build ausfuehren.
5. Nach Deployment `de`, `en` und `pl`, Kachelanzahl, Reihenfolge, Links, Bilder sowie Warnungen fuer unbekannte Kategorien pruefen.

Rollback besteht aus dem Zurueckschalten der drei Dashboard-Lesepfade auf das unveraenderte PostgREST-Repository. Die lokalen Kacheln bleiben waehrend der gesamten Migration erhalten.

## Open Questions

Keine. Kategorienname, Sprachfilter, Sortierreihenfolge, unbekannte Kategorien und Rueckfallverhalten sind fuer diese Ausbaustufe festgelegt.
