# Veranstaltungssuche – Issue #45

## Suchvertrag

Die Freitextsuche durchsucht den Titel. Beschreibung, Ort, Kategorie und
Veranstalter sind keine Freitext-Suchfelder. Kategorie, Zeitraum und Entfernung
bleiben eigenständige Filter.

Titel und Suchtext werden mit NFKC und deutscher Kleinschreibung normalisiert.
Ä/Ö/Ü entsprechen ae/oe/ue, ß entspricht ss. Satzzeichen einschließlich
Anführungszeichen und Bindestrichen sowie Leerraum werden zu Worttrennern.
Alle Suchwörter müssen im Titel vorkommen; Reihenfolge und direktes
Aneinanderstehen sind unerheblich. Teilwörter bleiben erlaubt.
Eine nach Normalisierung leere Eingabe schränkt die Treffer nicht ein.
Es gibt keine Tippfehlerkorrektur oder automatische Übersetzung.

Die gemeinsame Implementierung gilt für Smart-Village-, PostgREST- und lokale
Booking-Titel. Im Gateway folgen auf die Filterung die Deduplizierung nach
Termin-ID, Sortierung und Pagination. Bei gleichem Startzeitpunkt entscheidet
die Termin-ID; absteigende Sortierung kehrt auch diese Reihenfolge um.

## Verifikation

Automatisierte Tests prüfen Schreibvarianten, Leerraum, Unicode,
Anführungszeichen, Bindestriche, Wortreihenfolge und fehlende Suchwörter.
Ein Repository-Test prüft Trefferzahl und Pagination bei zeitgleichen Terminen.
Der Booking-Pfad hat einen eigenen Integrationstest für die Suchnormalisierung.

Die Produktionsabnahme aus Issue #45 steht aus: Für Biletado-, TMB- und manuelle
Events jeweils Suchbegriff, Zeitpunkt, erwartete Termin-ID und tatsächliche
Treffer dokumentieren. Die Änderungen am Suchvertrag ersetzen diese Abnahme
nicht. Das separate Zusammenführen lokaler Booking-Events nach der Gateway-
Pagination bleibt unverändert und ist bei Aktivierung dieses Pfads gesondert
zu prüfen.

## Bedienung und teilbare URLs

Die Texteingabe wird nach 300 ms ohne weitere Eingabe übernommen. Änderungen
an anderen Filtern übernehmen einen noch nicht abgeschickten Suchtext sofort.
Neue Suchbegriffe und Filter sowie Änderungen der Seitengröße starten auf Seite 1.

Die Veranstaltungsroute validiert `search`, `category`, `distance`, `from`, `to`,
`sortBy`, `ordering`, `page` und `pageSize` aus der URL. Datumswerte verwenden
lokale Kalendertage im Format YYYY-MM-DD. Ungültige Parameter fallen einzeln
auf Standardwerte zurück. Filter- und Seitenwechsel erzeugen Verlaufseinträge;
Zurück/Vorwärts und Neuladen stellen den angewendeten Zustand wieder her.
Navigation verwirft eine noch nicht übernommene Texteingabe.

Bei leeren Ergebnissen werden aktive Such-, Kategorie-, Radius- und Datumsfilter
angezeigt. „Alle Filter zurücksetzen“ entfernt diese Filter und die Sortierung,
springt auf Seite 1 und behält die gewählte Seitengröße. Die Texteingabe und die
Datumsauswahl werden dabei ebenfalls zurückgesetzt. Die neuen Texte sind in
Deutsch, Englisch und Polnisch vorhanden.

Interaktionstests prüfen Debouncing, Reset mit ausstehender Eingabe, sofortigen
Filterwechsel, Pagination sowie Zurück/Vorwärts mit einem echten Memory-Router.
Der UI-Sortierwert `descending` wird als API-Wert `desc` übertragen.
