# Automatische Ergänzung von Inhaltsübersetzungen

Das Content-Gateway nutzt die vorhandene LibreTranslate-Instanz, um fehlende englische und polnische Inhaltsfassungen vor der Ausgabe zu ergänzen. Es gibt keinen Rückkanal zum SVA Mainserver und keine Übersetzungsverwaltung.

## Inhaltswege

- Mainserver-Veranstaltungen: Titel, Beschreibung und beschreibende Unterfelder werden übersetzt. Bereits lokalisierte Seitenüberschriften bleiben erhalten.
- Mainserver-POIs und Featured Projects: Beschreibungen, Volltexte und Bildbeschreibungen werden übersetzt. Titel bleiben als Objekt-/Projektnamen unverändert.
- Cockpit-Karten: Vorhandene Sprachfassungen bleiben erhalten. Für Kategorien ohne Karten in der Zielsprache werden die deutschen Karten übersetzt.
- Buchungs-FAQs: Eine vorhandene Sammlung in der Zielsprache bleibt erhalten. Fehlt sie vollständig, wird die deutsche Sammlung übersetzt. Einzelne fehlende FAQ-Einträge werden nicht anhand von Reihenfolge oder Titel geraten: Die Quelle liefert keine gemeinsame Identität zwischen Sprachfassungen.
- Im Browser geladene Buchungsinhalte verwenden `POST /api/content/translate` mit `{ q: string[], target: "de" | "en" | "pl" }`. Direkte Browserzugriffe auf LibreTranslate und ein Übersetzungsschlüssel im Frontend entfallen.
- Bestehende lokale PostgREST-Sprachfassungen und UI-Sprachdateien bleiben erhalten.

Nur freigegebene redaktionelle Felder werden übersetzt. IDs, Links, Adressen, Ortsnamen, Anbieter-/Veranstalternamen und Bildnachweise bleiben als eigenständige Felder unverändert. Namen innerhalb von Fließtext können von der Übersetzungsmaschine bearbeitet werden. HTML-Tags und Attribute, Entities, ausgeschriebene HTTP(S)-Links und E-Mail-Adressen werden nicht an die Übersetzungsmaschine übergeben. Die automatische Übersetzung hat keine redaktionelle Freigabe.

## Cache und Ausfälle

Der Cache-Schlüssel enthält Dienst-URL, Quellsprache Deutsch, Zielsprache und vollständigen Ausgangstext. Änderungen am Original erzeugen automatisch einen neuen Schlüssel. Erfolgreiche Übersetzungen werden im begrenzten Arbeitsspeicher-Cache und optional auf einem persistenten Volume gespeichert. Gleichzeitige identische Anfragen teilen einen laufenden Übersetzungsauftrag.

Timeouts, fehlerhafte Antworten und nicht verfügbare Dienste führen zum Originaltext. Fehler werden nicht als erfolgreiche Übersetzung gespeichert; ein späterer Abruf versucht es erneut. Fehler beim Dateicache verhindern die Inhaltsausgabe nicht. Nicht mehr referenzierte Dateien können bei Bedarf durch Leeren des Cache-Volumes entfernt werden; der Cache wird automatisch wieder aufgebaut.

## Konfiguration und Auslieferung

Gateway-Variablen:

| Variable | Zweck |
| --- | --- |
| `TRANSLATE_URL` | Vollständiger LibreTranslate-Endpunkt, z. B. `https://translate.guben.de/translate`; ohne URL bleibt die Übersetzung deaktiviert |
| `TRANSLATE_API_KEY` | Optionaler serverseitiger Zugangsschlüssel |
| `TRANSLATE_TIMEOUT_MS` | Zeitlimit pro Dienstaufruf; Standard 3000 ms |
| `TRANSLATE_CACHE_DIR` | Optionales Verzeichnis für den persistenten Cache |

Compose und Produktionsstack binden `translation-cache` unter `/var/cache/translations` ein. Beim Rollout müssen Gateway und Frontend gemeinsam aktualisiert werden: Der Frontend-Produktionsproxy leitet ausschließlich für den Übersetzungsendpunkt auch POST-Anfragen samt JSON-Body weiter. Ein bisheriger `VITE_TRANSLATE_API_KEY` muss als `TRANSLATE_API_KEY` am Gateway hinterlegt werden, falls die Instanz Authentifizierung verlangt. Kein Schlüssel gehört in das Frontend-Build.

Die Implementierung wurde lokal mit simuliertem LibreTranslate geprüft. Eine produktive Portainer-Auslieferung und Prüfung der realen Übersetzungsqualität sind separate Schritte.
