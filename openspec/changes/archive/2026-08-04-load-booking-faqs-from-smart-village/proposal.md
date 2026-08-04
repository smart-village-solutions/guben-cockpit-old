## Why

Die FAQ-Inhalte der Booking-Seite sind derzeit fest in den Frontend-Sprachdateien hinterlegt und können deshalb nur durch eine neue Anwendungsversion gepflegt werden. Die bereits vorhandene serverseitige Smart-Village-OAuth-/GraphQL-Anbindung soll genutzt werden, damit redaktionell gepflegte FAQ-Generic-Items aktuell, sicher und ausfallsicher auf der Booking-Seite erscheinen.

## What Changes

- Einführung eines öffentlichen Content-Gateway-Endpunkts für sprachabhängige Booking-FAQs aus Smart Village.
- Abfrage der Smart-Village-Generic-Items vom Typ `FAQ` über die bestehende serverseitige OAuth-/GraphQL-Verbindung.
- Normalisierung von `title`, `contentBlocks[0].body`, `payload.languageCode` und `payload.sortWeight` in einen stabilen öffentlichen FAQ-Vertrag.
- Deterministische Sortierung nach absteigendem `sortWeight`, anschließend nach einer führenden numerischen Titelsequenz und danach alphabetisch.
- Sichere Darstellung sowohl von Plaintext als auch von sanitisiertem HTML in FAQ-Antworten.
- Beibehaltung der lokalen sprachabhängigen FAQs als Fallback bei Upstream-, Transport-, Vertrags- oder sprachspezifischen Leerzuständen.

## Capabilities

### New Capabilities

- `smart-village-booking-faq-integration`: Serverseitiges Laden, Validieren, Filtern, Sortieren und Bereitstellen sprachabhängiger Booking-FAQs aus Smart Village.
- `booking-faq-resilient-rendering`: Sichere Frontend-Darstellung der API-basierten FAQs mit lokalem sprachabhängigem Fallback.

### Modified Capabilities

Keine.

## Impact

- `content-gateway`: neuer GraphQL-Query-/Repository-Pfad, öffentlicher FAQ-Endpunkt und Vertragsvalidierung unter Wiederverwendung der bestehenden Smart-Village-Authentifizierung.
- `shared/public-content`: neuer stabiler FAQ-Response-Vertrag.
- `frontend`: API-Hook und Umstellung von `BookingFaq` auf API-Daten mit Sanitization und lokalem Fallback.
- Tests und Dokumentation: Query-/Mapping-/Sortier-, Endpunkt-, Hook-, Rendering-, Fallback- und HTML-Sicherheitsfälle.
- Keine neuen externen Dienste oder Browser-seitigen Zugangsdaten; die bestehende Smart-Village-Konfiguration wird wiederverwendet.
