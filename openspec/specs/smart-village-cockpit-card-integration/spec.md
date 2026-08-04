# smart-village-cockpit-card-integration Specification

## Purpose
TBD - created by archiving change load-cockpit-cards-from-smart-village. Update Purpose after archive.
## Requirements
### Requirement: Server-side Cockpit Card retrieval
The content gateway SHALL request Generic Items with `genericType` equal to `COCKPIT_CARD` through the existing authenticated Smart Village GraphQL client and SHALL NOT expose Smart Village credentials or the raw Generic Item payload to the browser.

#### Scenario: Authenticated card query
- **WHEN** the gateway loads Cockpit Cards in PostgREST mode
- **THEN** it requests the required card, content, media, web URL, category, and payload fields through the server-side Smart Village client

### Requirement: Language-specific card normalization
The gateway SHALL return only Cockpit Cards whose normalized `payload.languageCode` equals the requested content language and SHALL normalize every usable item into the existing `InformationCard` representation plus internal category and ordering metadata.

#### Scenario: Requested language is available
- **WHEN** Smart Village returns German, English, and Polish cards and German is requested
- **THEN** only German cards participate in dashboard enrichment

#### Scenario: Optional card content is absent
- **WHEN** a valid card has no content block, media content, or web URL
- **THEN** the gateway produces a card with nullable description, image, and button fields

#### Scenario: Malformed item is isolated
- **WHEN** one item lacks a usable ID, title, language, or exactly one named category
- **THEN** the gateway skips that item, emits a diagnostic warning with safe context, and continues processing other items

### Requirement: Category-only dashboard assignment
The gateway SHALL assign a Smart Village card to a dashboard tab exclusively by comparing normalized `categories.name` with the localized tab title. Normalization MUST remove surrounding whitespace and compare without case differences. The gateway MUST NOT use source IDs or tab IDs from the card payload for assignment.

#### Scenario: Existing category receives a new card
- **WHEN** a new card has a category name matching an existing localized dashboard tab
- **THEN** the card appears in that tab without changing the local dashboard structure

#### Scenario: Polish category contains surrounding whitespace
- **WHEN** the local tab title or Mainserver category differs only by surrounding whitespace
- **THEN** the card is assigned to that tab

#### Scenario: Unknown category is returned
- **WHEN** a card category has no matching localized dashboard tab
- **THEN** the gateway omits the card, records a diagnostic warning, and does not create a new tab or category

### Requirement: Deterministic category ordering
The gateway SHALL order assigned cards within each tab by numeric `payload.sortWeight` ascending and SHALL use the item ID as a deterministic final tie-breaker. Missing or invalid weights MUST be normalized to `0`.

#### Scenario: Cards arrive out of order
- **WHEN** Smart Village returns cards in an order different from their sort weights
- **THEN** each enriched tab contains them in ascending sort-weight order with stable ID ties

### Requirement: Local cards remain a source-level backup
The gateway SHALL preserve the locally loaded dashboard cards when the Smart Village request fails or when no valid language-specific card can be assigned to any existing tab. Once at least one Smart Village card can be assigned, Smart Village SHALL be authoritative for all cards in that language and local cards MUST NOT be mixed into otherwise empty tabs.

#### Scenario: Smart Village is unavailable
- **WHEN** the Cockpit Card request fails
- **THEN** the gateway returns the complete local dashboard structure and its local cards

#### Scenario: No returned category matches the structure
- **WHEN** Smart Village returns no valid card assignable to a localized dashboard tab
- **THEN** the gateway returns the local cards as backup

#### Scenario: At least one API card is assignable
- **WHEN** at least one valid Smart Village card matches an existing tab
- **THEN** every tab receives only its matching Smart Village cards and no local card remains

### Requirement: Consistent enriched dashboard responses
The gateway SHALL apply the same Cockpit Card enrichment and backup behavior to home content, dashboard content, and the public content bundle. Flattened public home cards MUST be derived from the enriched dashboard.

#### Scenario: Public content is requested
- **WHEN** the public content bundle is built with usable Smart Village cards
- **THEN** its nested dropdown cards and flattened home cards contain the same Mainserver-backed card set

